// The per-group asset modules scripts/asset-manifest.ts writes to src/generated/assets at dev, build
// and test start. Declared here, wildcard, so typechecking needs no generated files.
declare module '@/generated/assets/*' {
  import type { AssetGroup } from '@/lib/assets';
  const group: AssetGroup;
  export default group;
}
