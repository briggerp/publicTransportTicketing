const fs = require('fs');
const path = require('path');

// Paths
const dataRoot = path.resolve(__dirname, '..', 'data');
const csvPath = path.join(dataRoot, 'geography-map', 'places-zip-codes-switzerland.csv');

// Build canton -> provider map from configuration.json files
const cantonToProvider = {};
fs.readdirSync(dataRoot, { withFileTypes: true }).forEach(dirent => {
  if (!dirent.isDirectory()) return;
  const configPath = path.join(dataRoot, dirent.name, 'configuration.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const providerId = cfg.provider || cfg.displayName || dirent.name;
      if (Array.isArray(cfg.cantons)) {
        cfg.cantons.forEach(c => {
          if (!cantonToProvider[c]) {
            cantonToProvider[c] = providerId;
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse', configPath, e);
    }
  }
});

// Fixed column indices based on CSV header:
// 0 Ortschaftsname, 1 PLZ4, 4 Gemeindename, 6 Kantonskürzel
const PLZ_IDX = 1;
const CANTON_IDX = 6;
const ORT_IDX = 0;
const GEMEINDE_IDX = 4;

const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/);
if (lines.length < 2) {
  console.error('CSV appears empty');
  process.exit(1);
}

// temporary store with flag if exact match
const tempMap = {};
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split(';');
  const plz = cols[PLZ_IDX];
  const canton = cols[CANTON_IDX];
  const ort = cols[ORT_IDX];
  const gemeinde = cols[GEMEINDE_IDX];
  const exact = ort === gemeinde;
  if (!tempMap[plz]) {
    tempMap[plz] = { canton, exact };
  } else {
    if (!tempMap[plz].exact && exact) {
      tempMap[plz] = { canton, exact };
    }
  }
}

const plzMap = {};
Object.entries(tempMap).forEach(([plz, { canton }]) => {
  const provider = cantonToProvider[canton] || 'none';
  plzMap[plz] = { provider, canton };
});

const outPath = path.join(dataRoot, 'plz-provider-map.json');
fs.writeFileSync(outPath, JSON.stringify(plzMap, null, 2), 'utf8');
console.log('Generated', outPath, Object.keys(plzMap).length, 'entries');
