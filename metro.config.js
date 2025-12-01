// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona a extensão 'wasm' para que o expo-sqlite no web funcione corretamente.
config.resolver.assetExts.push('wasm');

module.exports = config;