#!/usr/bin/env node
/**
 * Splits a large GTFS text file (e.g. stop_times.txt) into chunks of a given
 * size, preserving the header row at the top of every chunk.
 *
 * Usage:
 *   node scripts/splitLargeGtfs.js <input-file> [chunk-size-mb]
 *
 * Examples:
 *   node scripts/splitLargeGtfs.js stop_times.txt          # 50 MB chunks (default)
 *   node scripts/splitLargeGtfs.js stop_times.txt 100      # 100 MB chunks
 *
 * Output: stop_times_001.txt, stop_times_002.txt, … in the same directory.
 *
 * Each chunk contains the original header line so it remains a valid GTFS file
 * and can be fed directly to importGtfs.js one chunk at a time.
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const inputFile    = process.argv[2];
const chunkMb      = parseFloat(process.argv[3] || '50');
const chunkBytes   = chunkMb * 1024 * 1024;

if (!inputFile) {
  console.error('Usage: node scripts/splitLargeGtfs.js <input-file> [chunk-size-mb]');
  process.exit(1);
}
if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

const dir      = path.dirname(inputFile);
const ext      = path.extname(inputFile);
const base     = path.basename(inputFile, ext);

let header     = null;
let chunkIndex = 1;
let bytesWritten = 0;
let writer     = null;
let linesInChunk = 0;
let totalLines = 0;

function chunkPath(i) {
  return path.join(dir, `${base}_${String(i).padStart(3, '0')}${ext}`);
}

function openNextChunk() {
  if (writer) writer.end();
  const filePath = chunkPath(chunkIndex++);
  writer = fs.createWriteStream(filePath, { encoding: 'utf8' });
  // Write header into every chunk so each file is self-contained
  if (header !== null) {
    writer.write(header + '\n');
    bytesWritten = Buffer.byteLength(header + '\n', 'utf8');
  } else {
    bytesWritten = 0;
  }
  linesInChunk = 0;
  process.stdout.write(`  → ${path.basename(filePath)}`);
  return writer;
}

async function split() {
  const fileSizeMb = (fs.statSync(inputFile).size / 1024 / 1024).toFixed(0);
  console.log(`Input : ${inputFile} (${fileSizeMb} MB)`);
  console.log(`Chunks: ~${chunkMb} MB each\n`);

  const rl = readline.createInterface({
    input:     fs.createReadStream(inputFile),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const lineBytes = Buffer.byteLength(line + '\n', 'utf8');

    // First line is always the header
    if (header === null) {
      header = line;
      writer = openNextChunk(); // openNextChunk writes the header
      continue;
    }

    // Start a new chunk if the current one is full
    if (bytesWritten + lineBytes > chunkBytes) {
      console.log(`  (${linesInChunk.toLocaleString()} data lines)`);
      writer = openNextChunk();
    }

    writer.write(line + '\n');
    bytesWritten += lineBytes;
    linesInChunk++;
    totalLines++;

    if (totalLines % 1_000_000 === 0) {
      process.stdout.clearLine?.(0);
      process.stdout.cursorTo?.(0);
      process.stdout.write(`  Processed ${(totalLines / 1e6).toFixed(1)}M lines…`);
    }
  }

  if (writer) {
    writer.end();
    console.log(`\n  (${linesInChunk.toLocaleString()} data lines)`);
  }

  console.log(`\n✓ Split into ${chunkIndex - 1} chunks (${totalLines.toLocaleString()} data lines total)`);
  console.log(`  Files written to: ${dir}`);
}

split().catch(err => { console.error(err); process.exit(1); });
