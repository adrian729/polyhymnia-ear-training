// The tables `cn build` writes to src/generated/cn-tables.mjs at dev, build and test start
// (scripts/cn-tables.ts). Declared here so typechecking needs no generated files.
declare module '@/generated/cn-tables.mjs' {
  const tables: Parameters<typeof import('cn/engine').createCn>[0];
  export default tables;
}
