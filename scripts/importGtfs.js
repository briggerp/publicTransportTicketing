#!/usr/bin/env node
/**
 * GTFS → stop-graph.json importer
 *
 * Usage:
 *   node scripts/importGtfs.js <path-to-gtfs-directory>
 *
 * Download the Swiss GTFS feed from:
 *   https://opentransportdata.swiss  (search "GTFS")
 *   Unzip into a folder, then point this script at that folder.
 *
 * Reads:   stops.txt, stop_times.txt
 * Writes:  data/stops/stop-graph.json
 *
 * Zone assignment strategy (cascading):
 *   1. If stops.txt zone_id is a bare integer matching a known zone number → use it.
 *   2. Otherwise estimate zone via geographic ring distance from each provider's
 *      city centre.  These are best-guesses — run the script, then correct
 *      individual entries in stop-graph.json as needed.
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

// ── Provider definitions ────────────────────────────────────────────────────
//   center      : [lat, lon] of zone-number centre (lowest-numbered zone)
//   bounds      : geographic bounding box to detect stops in this network
//   zoneBase    : the zone number at distance 0  (e.g. 210 for Passepartout)
//   ringKm      : approximate km covered per zone increment of 10
//                 (i.e. zone N+10 starts at this many km from zone N)

const PROVIDERS = {
  passepartout: {
    center:   [47.0502, 8.3093],
    bounds:   { minLat: 46.70, maxLat: 47.35, minLon: 7.90, maxLon: 8.90 },
    zoneBase: 210,
    ringKm:   5.5
  },
  zvv: {
    center:   [47.3783, 8.5403],
    bounds:   { minLat: 47.10, maxLat: 47.80, minLon: 8.30, maxLon: 9.00 },
    zoneBase: 110,
    ringKm:   4.5
  },
  libero: {
    center:   [46.9480, 7.4474],
    bounds:   { minLat: 46.60, maxLat: 47.30, minLon: 6.80, maxLon: 8.20 },
    zoneBase: 310,
    ringKm:   5.0
  },
  unireso: {
    center:   [46.2044, 6.1432],
    bounds:   { minLat: 46.00, maxLat: 46.60, minLon: 5.90, maxLon: 6.70 },
    zoneBase: 510,
    ringKm:   4.0
  }
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectProvider(lat, lon) {
  for (const [name, cfg] of Object.entries(PROVIDERS)) {
    const { minLat, maxLat, minLon, maxLon } = cfg.bounds;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return name;
    }
  }
  return null;
}

function estimateZone(lat, lon, provider) {
  const cfg  = PROVIDERS[provider];
  const dist = haversineKm(lat, lon, cfg.center[0], cfg.center[1]);
  const ring = Math.round(dist / cfg.ringKm);   // 0 = at centre
  return cfg.zoneBase + ring * 10;
}

function parseZoneId(raw) {
  // Accept bare integers that look like zone numbers (e.g. "110", "210")
  const n = parseInt(raw, 10);
  return (!isNaN(n) && String(n) === raw.trim()) ? n : null;
}

function parseCsvLine(line) {
  // Minimal CSV split that handles quoted fields (no embedded newlines).
  const fields = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; }
    else if (c === ',' && !inQuote) { fields.push(cur); cur = ''; }
    else { cur += c; }
  }
  fields.push(cur);
  return fields;
}

function parseHeader(line) {
  return parseCsvLine(line).map(f => f.trim().replace(/^\uFEFF/, '')); // strip BOM
}

// ── Phase 1 – parse stops.txt ────────────────────────────────────────────────

async function parseStops(gtfsDir) {
  const filePath = path.join(gtfsDir, 'stops.txt');
  const rl       = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });

  let header = null;
  const stops = {};    // stopId → { name, lat, lon, provider, zones }
  let skipped = 0;

  for await (const line of rl) {
    if (!header) { header = parseHeader(line); continue; }
    if (!line.trim()) continue;

    const fields     = parseCsvLine(line);
    const row        = Object.fromEntries(header.map((h, i) => [h, (fields[i] || '').trim()]));

    const locType    = parseInt(row.location_type || '0', 10);
    if (locType !== 0) continue;                          // skip stations/entrances/etc.

    const lat        = parseFloat(row.stop_lat);
    const lon        = parseFloat(row.stop_lon);
    if (isNaN(lat) || isNaN(lon)) continue;

    const provider   = detectProvider(lat, lon);
    if (!provider) { skipped++; continue; }               // outside all known networks

    // Zone: prefer explicit zone_id if it looks like a zone number
    const rawZoneId  = row.zone_id || '';
    const parsedZone = parseZoneId(rawZoneId);
    const zone       = parsedZone !== null ? parsedZone : estimateZone(lat, lon, provider);

    stops[row.stop_id] = {
      name:      row.stop_name,
      provider,
      zones:     [zone],
      lat:       Math.round(lat * 1e6) / 1e6,
      lon:       Math.round(lon * 1e6) / 1e6,
      neighbors: []
    };
  }

  console.log(`  stops:   ${Object.keys(stops).length} kept, ${skipped} outside known networks`);
  return stops;
}

// ── Phase 2 – parse stop_times.txt to build adjacency ───────────────────────
//
// stop_times.txt is typically 100–500 MB.  We process it in a single streaming
// pass.  The file is almost always ordered by (trip_id, stop_sequence) in Swiss
// GTFS, so we accumulate stops per trip and flush when the trip changes.

async function buildAdjacency(gtfsDir, stops) {
  const filePath   = path.join(gtfsDir, 'stop_times.txt');
  const rl         = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });

  const knownStops = new Set(Object.keys(stops));
  let header       = null;
  let currentTrip  = null;
  let tripStops    = [];        // [{ seq, stopId }] for the current trip
  let edgesAdded   = 0;

  function flushTrip() {
    // Sort by sequence (defensive – usually already sorted)
    tripStops.sort((a, b) => a.seq - b.seq);
    for (let i = 0; i < tripStops.length - 1; i++) {
      const a = tripStops[i].stopId;
      const b = tripStops[i + 1].stopId;
      if (!knownStops.has(a) || !knownStops.has(b)) continue;
      if (stops[a].provider !== stops[b].provider) continue;
      if (!stops[a].neighbors.includes(b)) { stops[a].neighbors.push(b); edgesAdded++; }
      if (!stops[b].neighbors.includes(a)) { stops[b].neighbors.push(a); edgesAdded++; }
    }
    tripStops = [];
  }

  for await (const line of rl) {
    if (!header) { header = parseHeader(line); continue; }
    if (!line.trim()) continue;

    const fields  = parseCsvLine(line);
    const row     = Object.fromEntries(header.map((h, i) => [h, (fields[i] || '').trim()]));
    const stopId  = row.stop_id;
    const tripId  = row.trip_id;
    const seq     = parseInt(row.stop_sequence, 10);

    if (tripId !== currentTrip) {
      if (currentTrip !== null) flushTrip();
      currentTrip = tripId;
    }

    if (knownStops.has(stopId)) {
      tripStops.push({ seq, stopId });
    }
  }
  flushTrip(); // flush last trip

  console.log(`  edges:   ${edgesAdded} neighbour links`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const gtfsDir = process.argv[2];
  if (!gtfsDir) {
    console.error('Usage: node scripts/importGtfs.js <path-to-gtfs-directory>');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(gtfsDir, 'stops.txt'))) {
    console.error(`Error: ${gtfsDir}/stops.txt not found`);
    process.exit(1);
  }

  console.log('Phase 1 – parsing stops.txt …');
  const stops = await parseStops(gtfsDir);

  console.log('Phase 2 – building adjacency from stop_times.txt …');
  await buildAdjacency(gtfsDir, stops);

  const meta = {
    _meta: {
      description: 'Stop graph generated from Swiss GTFS. Zone assignments are best-guess — correct individual entries as needed.',
      generated:   new Date().toISOString().slice(0, 10),
      source:      gtfsDir,
      stopCount:   Object.keys(stops).length
    }
  };

  const outPath = path.join(__dirname, '..', 'data', 'stops', 'stop-graph.json');
  fs.writeFileSync(outPath, JSON.stringify({ ...meta, ...stops }, null, 2));
  console.log(`\n✓ Written → ${outPath}`);
  console.log('  Review zone assignments in the file and correct any that look wrong.');
}

main().catch(err => { console.error(err); process.exit(1); });
