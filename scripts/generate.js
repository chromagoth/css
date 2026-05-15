#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SLOTS = [
  'ground', 'veil', 'field', 'trace',
  'ash', 'mist', 'haze', 'graphite',
  'circuit-lime', 'powder-blush', 'static-mint', 'laser-blue',
  'cyber-pink', 'ultraviolet', 'amber-glow', 'cherry-flux',
];

const args = process.argv.slice(2);
const palettesDirIdx = args.indexOf('--palettes-dir');
const PALETTES_DIR = palettesDirIdx >= 0
  ? path.resolve(args[palettesDirIdx + 1])
  : path.resolve(__dirname, '../../palettes/src');

const DIST_DIR = path.resolve(__dirname, '../dist');

function loadPalettes() {
  if (!fs.existsSync(PALETTES_DIR)) {
    throw new Error(`palettes dir not found: ${PALETTES_DIR}\nhint: pass --palettes-dir <path>`);
  }
  return fs.readdirSync(PALETTES_DIR)
    .filter(f => /^chromagoth-.+\.yaml$/.test(f))
    .sort()
    .map(file => yaml.load(fs.readFileSync(path.join(PALETTES_DIR, file), 'utf8')));
}

function toCss(palette) {
  const vars = SLOTS
    .filter(s => palette.colors[s] != null)
    .map(s => `  --${s}: ${String(palette.colors[s]).toLowerCase()};`)
    .join('\n');
  return `[data-theme="${palette.variant}"] {\n${vars}\n}\n`;
}

function toJs(palettes) {
  const entries = palettes.map(p => {
    const colorLines = SLOTS
      .filter(s => p.colors[s] != null)
      .map(s => `      '${s}': '${String(p.colors[s]).toLowerCase()}'`)
      .join(',\n');
    return `  {
    variant: '${p.variant}',
    name: '${p.name}',
    style: '${p.style}',
    dark: ${p.dark},
    colors: {\n${colorLines}\n    }
  }`;
  }).join(',\n');
  return `/* generated — do not edit */\nconst CHROMAGOTH_PALETTES = [\n${entries}\n];\n`;
}

function main() {
  const palettes = loadPalettes();
  fs.mkdirSync(DIST_DIR, { recursive: true });

  for (const p of palettes) {
    fs.writeFileSync(path.join(DIST_DIR, `chromagoth-${p.variant}.css`), toCss(p), 'utf8');
    console.log(`  ✓ dist/chromagoth-${p.variant}.css`);
  }

  const bundle = '/* Chromagoth — all theme variants · ash #6a6c70 is universal */\n\n'
    + palettes.map(toCss).join('\n');
  fs.writeFileSync(path.join(DIST_DIR, 'chromagoth.css'), bundle, 'utf8');
  console.log('  ✓ dist/chromagoth.css');

  fs.writeFileSync(
    path.join(DIST_DIR, 'palettes.json'),
    JSON.stringify(palettes, null, 2) + '\n',
    'utf8',
  );
  console.log('  ✓ dist/palettes.json');

  fs.writeFileSync(path.join(DIST_DIR, 'palettes.js'), toJs(palettes), 'utf8');
  console.log('  ✓ dist/palettes.js');

  console.log(`\n  ${palettes.length} themes generated.`);
}

main();
