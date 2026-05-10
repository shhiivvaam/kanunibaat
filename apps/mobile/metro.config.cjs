const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(projectRoot);
const watchFolders = [...(config.watchFolders ?? []), monorepoRoot];
config.watchFolders = [...new Set(watchFolders)];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.blockList = [/.*\/apps\/web\/\.next\/.*/];

module.exports = config;
