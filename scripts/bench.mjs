#!/usr/bin/env node
// Static load benchmark. Run after `pnpm build`; reads dist/ and reports the bytes each first
// screen pulls and the whole emitted set. Deterministic, so before/after are comparable.
//
//   node scripts/bench.mjs <label>            capture -> benchmarks/<label>.json
//   node scripts/bench.mjs compare <a> <b>    diff two captures
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { runInNewContext } from 'node:vm';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'benchmarks');

const category = ext => ({ '.js': 'js', '.mjs': 'js', '.css': 'css', '.woff2': 'font' }[ext] ?? ({ '.webp': 'image', '.avif': 'image', '.png': 'image', '.svg': 'image', '.jpg': 'image' }[ext] ?? 'other'));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function urlToFile(url) {
  const base = process.env.PAGES_BASE && process.env.PAGES_BASE !== '/' ? process.env.PAGES_BASE.replace(/\/$/, '') : '';
  const pathname = url.startsWith(base) ? url.slice(base.length) : url;
  return join(DIST, decodeURIComponent(pathname.replace(/^\//, '')));
}

const bytes = path => (existsSync(path) ? statSync(path).size : 0);

/** The artwork the inline preload script would add at this pixel ratio, by running the script for
 *  real against a stub DOM. Exact, and independent of how the script is written. */
function preloadedArtwork(html, dpr) {
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('devicePixelRatio'));
  if (!script) return [];
  const urls = [];
  const document = {
    createElement: () => ({}),
    head: { append: element => urls.push(element.href) },
  };
  runInNewContext(script, { window: { devicePixelRatio: dpr }, document });
  return urls;
}

/** Every asset the HTML references: scripts, modulepreloads, stylesheets, font preloads, favicon,
 *  and the artwork the inline preload script names for the given screen density. */
function firstScreen(html, dpr = 2) {
  const urls = new Set();
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (url.startsWith('/') && !url.endsWith('/')) urls.add(url.split('?')[0]);
  }
  for (const url of preloadedArtwork(html, dpr)) urls.add(url);
  const files = [...urls].map(url => ({ url, path: urlToFile(url) }));
  const rows = files.map(({ url, path }) => ({ url, category: category(extname(path)), bytes: bytes(path) }));
  const totals = {};
  for (const row of rows) totals[row.category] = (totals[row.category] ?? 0) + row.bytes;
  return { dpr, rows: rows.sort((a, b) => b.bytes - a.bytes), totals, totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0), count: rows.length };
}

function capture(label) {
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  const files = walk(DIST);
  const byExt = {};
  const imageRows = [];
  for (const path of files) {
    const ext = extname(path);
    const size = statSync(path).size;
    const name = relative(DIST, path);
    byExt[ext] = byExt[ext] ?? { count: 0, bytes: 0 };
    byExt[ext].count++;
    byExt[ext].bytes += size;
    if (category(ext) === 'image') imageRows.push({ name, bytes: size });
  }
  const images = imageRows.reduce((acc, row) => ({ count: acc.count + 1, bytes: acc.bytes + row.bytes }), { count: 0, bytes: 0 });
  const at = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  const report = {
    label,
    at,
    date: new Date().toISOString(),
    firstScreen: Object.fromEntries([1, 2, 3].map(dpr => [dpr, firstScreen(html, dpr)])),
    dist: { totalBytes: files.reduce((sum, path) => sum + statSync(path).size, 0), count: files.length, byExt, images },
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${label}.json`), JSON.stringify(report, null, 2) + '\n');
  return report;
}

const fmt = n => `${(n / 1024).toFixed(1)} KB`;

function print(report) {
  console.log(`\n# ${report.label} @ ${report.at} (${report.date})`);
  console.log('\nFirst screen (referenced by index.html), @2x:');
  const screen = report.firstScreen[2];
  for (const [cat, total] of Object.entries(screen.totals).sort()) console.log(`  ${cat.padEnd(6)} ${fmt(total)}`);
  console.log(`  ${'TOTAL'.padEnd(6)} ${fmt(screen.totalBytes)}  (${screen.count} requests)`);
  console.log('\nFirst screen total by density:');
  for (const dpr of [1, 2, 3]) console.log(`  @${dpr}x  ${fmt(report.firstScreen[dpr].totalBytes)}  (${report.firstScreen[dpr].count} requests)`);
  console.log('\nWhole dist:');
  for (const [ext, { count, bytes }] of Object.entries(report.dist.byExt).sort((a, b) => b[1].bytes - a[1].bytes)) console.log(`  ${ext.padEnd(6)} ${String(count).padStart(4)} files  ${fmt(bytes)}`);
  console.log(`  TOTAL  ${report.dist.count} files  ${fmt(report.dist.totalBytes)}`);
}

function diff(aLabel, bLabel) {
  const a = JSON.parse(readFileSync(join(OUT, `${aLabel}.json`), 'utf8'));
  const b = JSON.parse(readFileSync(join(OUT, `${bLabel}.json`), 'utf8'));
  console.log(`\n# ${aLabel} -> ${bLabel}`);
  const line = (name, av, bv) => console.log(`  ${name.padEnd(24)} ${fmt(av).padStart(10)} -> ${fmt(bv).padStart(10)}  ${(bv - av >= 0 ? '+' : '') + fmt(bv - av)}`);
  const count = (name, av, bv) => console.log(`  ${name.padEnd(24)} ${String(av).padStart(10)} -> ${String(bv).padStart(10)}  ${bv - av >= 0 ? '+' : ''}${bv - av}`);
  for (const dpr of [1, 2, 3]) line(`first screen @${dpr}x`, a.firstScreen[dpr].totalBytes, b.firstScreen[dpr].totalBytes);
  count('first screen requests', a.firstScreen[2].count, b.firstScreen[2].count);
  line('dist total', a.dist.totalBytes, b.dist.totalBytes);
  line('images total', a.dist.images.bytes, b.dist.images.bytes);
  count('images count', a.dist.images.count, b.dist.images.count);
}

const [mode, ...rest] = process.argv.slice(2);
if (mode === 'compare') diff(rest[0], rest[1]);
else if (mode) print(capture(mode));
else { console.error('usage: bench.mjs <label> | compare <a> <b>'); process.exit(1); }
