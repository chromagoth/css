#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ASH = '#6a6c70';
const REQUIRED_FIELDS = ['name', 'variant', 'style', 'dark', 'colors'];
const REQUIRED_SLOTS = [
  'ground', 'veil', 'field', 'trace',
  'ash', 'mist', 'haze', 'graphite',
  'circuit-lime', 'powder-blush', 'static-mint', 'laser-blue',
  'cyber-pink', 'ultraviolet', 'amber-glow', 'cherry-flux',
];

const args = process.argv.slice(2);
const palettesDirIdx = args.indexOf('--palettes-dir');
const PALETTES_DIR = palettesDirIdx >= 0
  ? path.resolve(args[palettesDirIdx + 1])
  : process.env.CHROMAGOTH_PALETTES_DIR
    ? path.resolve(process.env.CHROMAGOTH_PALETTES_DIR)
    : path.resolve(__dirname, '../../palettes/src');

let errors = 0;

function err(file, msg) {
  console.error(`  ✗  ${file}: ${msg}`);
  errors++;
}

const files = fs.readdirSync(PALETTES_DIR)
  .filter(f => /^chromagoth-.+\.yaml$/.test(f))
  .sort();

for (const file of files) {
  const p = yaml.load(fs.readFileSync(path.join(PALETTES_DIR, file), 'utf8'));

  for (const field of REQUIRED_FIELDS) {
    if (p[field] == null) err(file, `missing field "${field}"`);
  }

  for (const slot of REQUIRED_SLOTS) {
    if (!p.colors?.[slot]) err(file, `missing color slot "${slot}"`);
  }

  const ash = String(p.colors?.ash ?? '').toLowerCase();
  if (ash !== ASH) err(file, `ash must be ${ASH}, got "${ash}"`);
}

if (errors) {
  console.error(`\n  ${errors} error(s) across ${files.length} palette(s).`);
  process.exit(1);
} else {
  console.log(`  ✓ ${files.length} palettes valid.`);
}
