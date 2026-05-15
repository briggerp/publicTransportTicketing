const fs   = require('fs');
const path = require('path');

const GRAPH_PATH = path.join(__dirname, '..', 'data', 'stops', 'stop-graph.json');

class StopGraph {
  constructor() {
    this.graph = {};
    this._nameIndex = []; // [{ stopId, nameLower, name, provider, zones }]
    this._loaded = false;
  }

  load() {
    if (this._loaded) return;
    const raw = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
    for (const [id, stop] of Object.entries(raw)) {
      if (id === '_meta') continue;
      this.graph[id] = stop;
      this._nameIndex.push({
        stopId:    id,
        nameLower: stop.name.toLowerCase(),
        name:      stop.name,
        provider:  stop.provider,
        zones:     stop.zones,
        lat:       stop.lat,
        lon:       stop.lon
      });
    }
    this._loaded = true;
    console.log(`✓ Loaded ${Object.keys(this.graph).length} stops from stop-graph.json`);
  }

  /**
   * Search stops by name fragment, optionally filtered by provider.
   * Returns up to `limit` results ordered by match quality (prefix > contains).
   */
  search(query, { provider = null, limit = 20 } = {}) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();

    const scored = [];
    for (const entry of this._nameIndex) {
      if (provider && entry.provider !== provider) continue;
      const idx = entry.nameLower.indexOf(q);
      if (idx === -1) continue;
      scored.push({ ...entry, _score: idx === 0 ? 0 : 1 }); // prefix matches first
    }

    scored.sort((a, b) => a._score - b._score || a.name.localeCompare(b.name));
    return scored.slice(0, limit).map(({ _score, nameLower, ...rest }) => rest);
  }

  getStop(stopId) {
    return this.graph[stopId] || null;
  }
}

// Singleton — one load per server process
const instance = new StopGraph();
module.exports = instance;
