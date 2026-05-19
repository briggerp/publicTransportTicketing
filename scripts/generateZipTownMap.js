// Generate zipTownMap.json with all possible town names per PLZ
const fs = require('fs');
const path = require('path');

const dataRoot = path.resolve(__dirname, '..', 'data');
const csvPath = path.join(dataRoot, 'geography-map', 'places-zip-codes-switzerland.csv');
const outPath = path.join(dataRoot, 'geography-map', 'zipTownMap.json');

// Read CSV
const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/);
if (lines.length < 2) {
  console.error('CSV empty');
  process.exit(1);
}
const header = lines[0].split(';');
const PLZ_IDX = header.indexOf('PLZ4');
let ORT_IDX = header.indexOf('Ortschaftsname');
if (ORT_IDX === -1 && header[0].replace(/^﻿/, '') === 'Ortschaftsname') ORT_IDX = 0;
const GEMEINDE_IDX = header.indexOf('Gemeindename');
console.error('Header columns:', header);
console.error('Indexes PLZ', PLZ_IDX, 'ORT', ORT_IDX, 'GEM', GEMEINDE_IDX);
if (PLZ_IDX === -1 || ORT_IDX === -1 || GEMEINDE_IDX === -1) {
  console.error('Missing columns');
  process.exit(1);
}

const map = {};
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split(';');
  const plz = cols[PLZ_IDX];
  const ort = cols[ORT_IDX];
  const gemeinde = cols[GEMEINDE_IDX];
  // Use Ortschaftsname as town name (include all distinct names)
  const town = ort;
  if (!map[plz]) map[plz] = new Set();
  map[plz].add(town);
}

// Convert sets to array or single string if only one
const result = {};
Object.entries(map).forEach(([plz, set]) => {
  const arr = Array.from(set);
  result[plz] = arr.length === 1 ? arr[0] : arr; // keep single as string for backward compatibility
});

fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
console.log('Generated', outPath, Object.keys(result).length, 'entries');
