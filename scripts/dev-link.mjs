import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sources = {
  '@polyhymnia/mnx': 'notation/packages/mnx',
  '@polyhymnia/mnx-score': 'notation/packages/mnx-score',
  '@polyhymnia/notation-fonts': 'notation/packages/notation-fonts',
  '@polyhymnia/notation-engine': 'notation/packages/notation-engine',
  '@polyhymnia/notation-react': 'notation/packages/notation-react',
  '@polyhymnia/music-theory': 'music-theory',
  '@polyhymnia/web-audio': 'web-audio',
  '@polyhymnia/rhythm': 'rhythm/packages/rhythm',
  '@polyhymnia/rhythm-react': 'rhythm/packages/rhythm-react',
  '@polyhymnia/audio-input': 'audio-analysis/packages/audio-input',
  '@polyhymnia/audio-analysis': 'audio-analysis/packages/audio-analysis',
  '@polyhymnia/audio-analysis-pitchy': 'audio-analysis/packages/audio-analysis-pitchy',
};

const root = resolve(process.env.POLYHYMNIA_SRC ?? '..');
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const stateDir = resolve('node_modules/.polyhymnia-dev-links');
const stateFile = resolve(stateDir, 'state.json');
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
const names = Object.keys(sources).filter(name => name in (manifest.dependencies ?? {}) || name in (manifest.devDependencies ?? {}));

// Change only node_modules: pnpm link writes local overrides to tracked files.
if (process.argv[2] === 'unlink') {
  for (const [name, backup] of Object.entries(state)) {
    if (!(name in sources)) throw new Error('Invalid local-link state.');
    const destination = resolve('node_modules', name);
    rmSync(destination, { recursive: true, force: true });
    if (backup) renameSync(resolve(stateDir, name), destination);
  }
  rmSync(stateDir, { recursive: true, force: true });
  console.log('Restored installed packages. Dependency files unchanged.');
} else if (process.argv[2] === 'link') {
  for (const name of names) {
    const source = resolve(root, sources[name]);
    if (!existsSync(resolve(source, 'dist/index.js'))) throw new Error(`Build ${source} before linking ${name}.`);
  }
  mkdirSync(stateDir, { recursive: true });
  for (const name of names) {
    if (name in state) continue;
    const destination = resolve('node_modules', name);
    const backup = existsSync(destination);
    if (backup) {
      const target = resolve(stateDir, name);
      mkdirSync(dirname(target), { recursive: true });
      renameSync(destination, target);
    }
    state[name] = backup;
    writeFileSync(stateFile, JSON.stringify(state));
    mkdirSync(dirname(destination), { recursive: true });
    symlinkSync(resolve(root, sources[name]), destination, 'dir');
  }
  console.log('Linked built local packages. Run pnpm dev:unlink before installing or committing.');
} else {
  throw new Error('Use link or unlink.');
}
