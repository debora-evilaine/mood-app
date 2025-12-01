// Declarations to satisfy TypeScript for the web version of expo-sqlite's wa-sqlite
// These are minimal 'any' bindings for development / browser builds.

declare module 'expo-sqlite/web/wa-sqlite/sqlite-api' {
  // The library exposes a low-level sqlite API; provide a loose type to silence TS.
  export type SQLiteAPI = any;
  const SQLite: SQLiteAPI;
  export = SQLite;
}

declare module 'expo-sqlite/web/wa-sqlite/wa-sqlite.wasm' {
  const wasm: any;
  export default wasm;
}

declare module 'expo-sqlite/web/wa-sqlite/sqlite-constants' {
  const constants: any;
  export = constants;
}

declare module 'expo-sqlite/web/wa-sqlite/wa-sqlite' {
  const factory: any;
  export default factory;
}
