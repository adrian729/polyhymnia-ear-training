#!/usr/bin/env node
// Load-timing benchmark. Drives headless Chrome (CDP, no extra deps) against `vite preview` and
// measures what a reader actually waits for: FCP, first-screen-visible, load, transferred bytes, request counts.
// Service worker is bypassed and the cache disabled so every run measures a cold first visit.
//
//   node scripts/bench-timings.mjs <label> [--port 4173] [--runs 2]
//   node scripts/bench-timings.mjs compare <a> <b>
//
// Network is throttled to Slow 4G, where art weight shows. Captures go to benchmarks/timings-<label>.json.
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'benchmarks');
const CHROME = process.env.CHROME_BIN ?? 'google-chrome';

// Lighthouse Slow 4G.
const THROTTLE = { offline: false, latency: 150, downloadThroughput: 209715, uploadThroughput: 96000 };

const ROUTES = ['/', '/exercises/intervals', '/presets'];
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, dpr: 2, mobile: true },
  { name: 'desktop', width: 1440, height: 900, dpr: 1, mobile: false },
];

const withTimeout = (promise, ms, what) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout waiting for ${what}`)), ms)),
]);

const stamp = () => new Date().toISOString().slice(11, 19);
const log = (...args) => console.log(`[${stamp()}]`, ...args);

function killTree(child, name) {
  if (!child || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill(); } catch {} }
  setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 3000);
}

function startPreview(port) {
  const child = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('preview did not start')), 30000);
    const onData = data => {
      if (/Local:\s+http/.test(String(data))) { clearTimeout(timer); resolve(child); }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`preview exited (${code})`)); });
  });
}

function startChrome() {
  const profile = mkdtempSync(join(tmpdir(), 'bench-chrome-'));
  const child = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const browserUrl = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('chrome did not print a debugger URL')), 30000);
    child.stderr.on('data', data => {
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(String(data));
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    child.on('exit', code => { clearTimeout(timer); reject(new Error(`chrome exited (${code})`)); });
  });
  // The browser endpoint speaks Target domain only; attach to the page target for Page/Network/Runtime.
  const url = browserUrl.then(async wsUrl => {
    const base = wsUrl.replace(/^ws:/, 'http:').replace(/\/devtools\/browser\/.*$/, '');
    for (let i = 0; i < 50; i++) {
      const targets = await (await fetch(`${base}/json/list`)).json();
      const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
      await new Promise(r => setTimeout(r, 200));
    }
    throw new Error('no page target appeared');
  });
  return { child, profile, url };
}

function cdp(endpoint) {
  if (typeof WebSocket === 'undefined') throw new Error('this Node has no global WebSocket; need Node 22+');
  const socket = new WebSocket(endpoint, { maxPayload: 256 * 1024 * 1024 });
  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.id !== undefined) {
      const waiter = pending.get(message.id);
      if (waiter) { pending.delete(message.id); message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result); }
    } else {
      for (const listener of listeners) listener(message);
    }
  });
  return {
    ready,
    close: () => socket.close(),
    onEvent: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    send: (method, params) => {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

async function evaluate(session, expression, awaitPromise = true) {
  const { result } = await session.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (result.subtype === 'error') throw new Error(`evaluate failed: ${result.description}`);
  return result.value;
}

const TIMING_EXPRESSION = `(() => {
  const nav = performance.getEntriesByType('navigation')[0] ?? {};
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    dcl: nav.domContentLoadedEventEnd ?? null,
    load: nav.loadEventEnd ?? null,
    fcp: fcp ? fcp.startTime : null,
  };
})()`;

async function measureLoad(session, url, viewport, scroll) {
  const requests = new Map();
  const inFlight = new Set();
  let loadFired = false;
  const off = session.onEvent(message => {
    const { method, params } = message;
    if (method === 'Network.requestWillBeSent') {
      if (params.request.url.startsWith('http')) {
        requests.set(params.requestId, { url: params.request.url, type: params.type, bytes: 0, failed: false });
        inFlight.add(params.requestId);
      }
    } else if (method === 'Network.loadingFinished') {
      const entry = requests.get(params.requestId);
      if (entry) entry.bytes = params.encodedDataLength;
      inFlight.delete(params.requestId);
    } else if (method === 'Network.loadingFailed') {
      const entry = requests.get(params.requestId);
      if (entry) entry.failed = true;
      inFlight.delete(params.requestId);
    } else if (method === 'Page.loadEventFired') {
      loadFired = true;
    }
  });

  try {
    await session.send('Page.enable');
    await session.send('Network.enable');
    await session.send('Runtime.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Network.setBypassServiceWorker', { bypass: true });
    await session.send('Network.emulateNetworkConditions', THROTTLE);
    await session.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.dpr, mobile: viewport.mobile });
    // Arm the first-screen reveal observer right after commit: the reveal can happen at any point
    // after first paint, and attaching later would miss it and report the lookup time instead.
    // (Armed post-navigate because navigation wipes the page's JS context.)
    await session.send('Page.navigate', { url });
    await evaluate(session, `window.__benchVisible = (async () => {
      const visible = await Promise.race([
        new Promise(resolve => {
          const watch = root => new MutationObserver(() => {
            if (!root.hasAttribute('data-first-paint')) resolve(performance.now());
          }).observe(root, { attributes: true, attributeFilter: ['data-first-paint'] });
          const begun = root => {
            if (root.hasAttribute('data-first-paint')) watch(root);
            else new MutationObserver((_, observer) => {
              if (root.hasAttribute('data-first-paint')) { observer.disconnect(); watch(root); }
            }).observe(root, { attributes: true, attributeFilter: ['data-first-paint'] });
          };
          const root = document.getElementById('root');
          if (root) begun(root);
          else new MutationObserver((_, observer) => {
            const el = document.getElementById('root');
            if (el) { observer.disconnect(); begun(el); }
          }).observe(document.documentElement, { childList: true, subtree: true });
        }),
        new Promise(resolve => setTimeout(() => resolve(null), 30000)),
      ]);
      return visible;
    })()`, false);

    await withTimeout((async () => { while (!loadFired) await new Promise(r => setTimeout(r, 50)); })(), 60000, 'load event');
    // Settle: no in-flight requests for a full second, or give up after 45 s.
    const settle = async (limit) => {
      const start = Date.now();
      let quietSince = 0;
      while (Date.now() - start < limit) {
        if (inFlight.size === 0) {
          if (!quietSince) quietSince = Date.now();
          if (Date.now() - quietSince > 1000) break;
        } else quietSince = 0;
        await new Promise(r => setTimeout(r, 100));
      }
    };
    await settle(5000);
    const initial = { bytes: [...requests.values()].reduce((s, r) => s + r.bytes, 0), requests: [...requests.values()].filter(r => !r.failed).length };
    // Lazily loaded art only arrives when reached; scrolling measures what the page costs a reader
    // who actually travels it, which is where the 10-per-page weight lives.
    if (scroll) {
      await evaluate(session, `(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 150));
        }
        window.scrollTo(0, document.body.scrollHeight);
      })()`, false);
      await settle(20000);
    }
    const timing = await evaluate(session, TIMING_EXPRESSION);
    timing.visible = await evaluate(session, 'window.__benchVisible');
    const rows = [...requests.values()].filter(r => !r.failed);
    const failed = [...requests.values()].filter(r => r.failed).map(r => r.url);
    const byType = {};
    for (const row of rows) {
      byType[row.type] = byType[row.type] ?? { count: 0, bytes: 0 };
      byType[row.type].count++;
      byType[row.type].bytes += row.bytes;
    }
    return { ...timing, bytes: rows.reduce((s, r) => s + r.bytes, 0), requests: rows.length, initialBytes: initial.bytes, initialRequests: initial.requests, failed, byType };
  } finally {
    off();
  }
}

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
};

async function capture(label, port, runs, scroll, routes = ROUTES) {
  const preview = await startPreview(port);
  const { child: chrome, profile, url: endpoint } = startChrome();
  try {
    const results = [];
    for (const route of routes) {
      for (const viewport of VIEWPORTS) {
        const session = cdp(await endpoint);
        await session.ready;
        try {
          const samples = [];
          for (let i = 0; i < runs; i++) {
            log(`${route} @ ${viewport.name} (run ${i + 1}/${runs})`);
            const started = Date.now();
            samples.push(await measureLoad(session, `http://127.0.0.1:${port}${route}`, viewport, scroll));
            log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
          }
          const med = field => median(samples.map(s => s[field] ?? Infinity).filter(Number.isFinite));
          results.push({ route, viewport: viewport.name, dpr: viewport.dpr, samples, median: { dcl: med('dcl'), load: med('load'), fcp: med('fcp'), visible: med('visible'), bytes: med('bytes'), requests: med('requests'), initialBytes: med('initialBytes'), initialRequests: med('initialRequests') } });
        } finally {
          session.close();
        }
      }
    }
    const report = { label, at: execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(), date: new Date().toISOString(), throttle: 'slow4g', scroll, runs, results };
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, `timings-${label}.json`), JSON.stringify(report, null, 2) + '\n');
    return report;
  } finally {
    killTree(chrome, 'chrome');
    killTree(preview, 'preview');
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 10000);
      chrome.once('exit', () => { clearTimeout(timer); resolve(); });
    });
    for (let i = 0; i < 20; i++) {
      try { rmSync(profile, { recursive: true, force: true }); break; }
      catch { await new Promise(r => setTimeout(r, 500)); }
    }
  }
}

const fmtMs = n => (n == null ? 'n/a' : `${Math.round(n)} ms`);
const fmtKb = n => `${(n / 1024).toFixed(0)} KB`;

function print(report) {
  console.log(`\n# timings ${report.label} @ ${report.at} (${report.date}) — Slow 4G, cold, SW bypassed${report.scroll ? ', scrolled to foot' : ''}`);
  for (const r of report.results) {
    const m = r.median;
    const failed = r.samples.flatMap(s => s.failed);
    const note = failed.length ? `  !! ${failed.length} failed` : '';
    console.log(`  ${r.route.padEnd(28)} ${r.viewport.padEnd(7)} FCP ${fmtMs(m.fcp).padStart(8)}  visible ${fmtMs(m.visible).padStart(8)}  load ${fmtMs(m.load).padStart(8)}  bytes ${fmtKb(m.bytes).padStart(8)} (init ${fmtKb(m.initialBytes)})  ${m.requests}/${m.initialRequests} req${note}`);
  }
}

function compare(aLabel, bLabel) {
  const a = JSON.parse(readFileSync(join(OUT, `timings-${aLabel}.json`), 'utf8'));
  const b = JSON.parse(readFileSync(join(OUT, `timings-${bLabel}.json`), 'utf8'));
  console.log(`\n# timings ${aLabel} -> ${bLabel}`);
  for (const rb of b.results) {
    const ra = a.results.find(r => r.route === rb.route && r.viewport === rb.viewport);
    if (!ra) continue;
    const delta = field => {
      const av = ra.median[field];
      const bv = rb.median[field];
      if (av == null || bv == null) return 'n/a'.padStart(9);
      const d = bv - av;
      const sign = d >= 0 ? '+' : '';
      return field === 'requests' ? `${sign}${d}` : `${sign}${Math.round(d)} ms`;
    };
    console.log(`  ${rb.route.padEnd(28)} ${rb.viewport.padEnd(7)} FCP ${delta('fcp').padStart(9)}  visible ${delta('visible').padStart(9)}  load ${delta('load').padStart(9)}  bytes ${((rb.median.bytes - ra.median.bytes) / 1024).toFixed(0)} KB  req ${rb.median.requests - ra.median.requests >= 0 ? '+' : ''}${rb.median.requests - ra.median.requests}`);
  }
}

const [mode, ...rest] = process.argv.slice(2);
const flag = name => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest.splice(i, 2)[1] : undefined;
};
if (mode === 'compare') { compare(rest[0], rest[1]); process.exit(0); }
else if (mode) {
  const port = Number(flag('--port') ?? 4173);
  const runs = Number(flag('--runs') ?? 2);
  const scroll = rest.includes('--scroll') || process.argv.includes('--scroll');
  const only = flag('--routes');
  const routes = only ? only.split(',') : ROUTES;
  try {
    print(await capture(mode, port, runs, scroll, routes));
    process.exit(0);
  } catch (error) {
    console.error('FAILED:', error.message);
    process.exit(1);
  }
} else { console.error('usage: bench-timings.mjs <label> [--port N] [--runs N] [--scroll] | compare <a> <b>'); process.exit(1); }
