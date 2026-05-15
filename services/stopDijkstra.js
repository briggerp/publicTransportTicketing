/**
 * Min-zone Dijkstra for Swiss public transport stop graphs.
 *
 * Standard Dijkstra where the "cost" of a path is the number of distinct
 * fare zones visited, not the number of hops.  This finds the subscription
 * that covers the fewest zones, which is cheaper than the fewest-hops path
 * whenever a longer route avoids an extra zone.
 *
 * State space: (stopId, frozenZoneSet).  Two paths arriving at the same stop
 * with the same zone count but DIFFERENT zone sets are kept separate, because
 * their future costs can diverge (one set may already contain a neighbour's
 * zone; the other may not).  In practice the explored state space is small
 * because zone counts cap at ~10 and transit graphs are sparse.
 */

class MinHeap {
  constructor() { this._data = []; }

  get size() { return this._data.length; }

  push(item) {
    this._data.push(item);
    this._bubbleUp(this._data.length - 1);
  }

  pop() {
    const top = this._data[0];
    const last = this._data.pop();
    if (this._data.length > 0) {
      this._data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._data[parent].cost <= this._data[i].cost) break;
      [this._data[parent], this._data[i]] = [this._data[i], this._data[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this._data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this._data[l].cost < this._data[smallest].cost) smallest = l;
      if (r < n && this._data[r].cost < this._data[smallest].cost) smallest = r;
      if (smallest === i) break;
      [this._data[smallest], this._data[i]] = [this._data[i], this._data[smallest]];
      i = smallest;
    }
  }
}

/**
 * Find the path from startId to endId that traverses the fewest distinct zones.
 *
 * @param {object} graph       - Stop graph keyed by stopId
 * @param {string} startId     - Origin stop ID
 * @param {string} endId       - Destination stop ID
 * @param {number} [maxZones]  - Abort early if cost exceeds this (default: 20)
 * @returns {{ zonesTraversed: number, zones: number[], path: string[] } | null}
 */
function findMinZonePath(graph, startId, endId, maxZones = 20) {
  const startStop = graph[startId];
  const endStop   = graph[endId];

  if (!startStop || !endStop) return null;
  if (startStop.provider !== endStop.provider) return null;
  if (startId === endId) {
    return { zonesTraversed: startStop.zones.length, zones: startStop.zones.slice(), path: [startId] };
  }

  const heap = new MinHeap();
  // visited: Map<stopId, Set<zonesKey>>  – prunes dominated states
  const visited = new Map();

  const initZones = new Set(startStop.zones);
  heap.push({ cost: initZones.size, stopId: startId, zones: initZones, path: [startId] });

  while (heap.size > 0) {
    const { cost, stopId, zones, path } = heap.pop();

    if (cost > maxZones) continue;

    const zonesKey = sortedKey(zones);
    if (!visited.has(stopId)) visited.set(stopId, new Set());
    if (visited.get(stopId).has(zonesKey)) continue;
    visited.get(stopId).add(zonesKey);

    if (stopId === endId) {
      return {
        zonesTraversed: cost,
        zones: [...zones].sort((a, b) => a - b),
        path
      };
    }

    const stop = graph[stopId];
    for (const neighborId of (stop.neighbors || [])) {
      const neighbor = graph[neighborId];
      if (!neighbor || neighbor.provider !== startStop.provider) continue;

      const newZones = new Set(zones);
      for (const z of neighbor.zones) newZones.add(z);
      const newCost   = newZones.size;
      const newKey    = sortedKey(newZones);

      if (!visited.get(neighborId)?.has(newKey)) {
        heap.push({
          cost:   newCost,
          stopId: neighborId,
          zones:  newZones,
          path:   [...path, neighborId]
        });
      }
    }
  }

  return null; // no path found
}

function sortedKey(zoneSet) {
  return [...zoneSet].sort((a, b) => a - b).join(',');
}

module.exports = { findMinZonePath };
