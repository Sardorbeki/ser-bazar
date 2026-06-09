const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "react-is": path.resolve(__dirname, "node_modules/react-is"),
};

const { blockList } = config.resolver;
const exclusions = [
  /\.local[\/\\]/,
  /\.local$/,
];

if (blockList) {
  if (Array.isArray(blockList)) {
    config.resolver.blockList = [...blockList, ...exclusions];
  } else {
    config.resolver.blockList = [blockList, ...exclusions];
  }
} else {
  config.resolver.blockList = exclusions;
}

config.watchFolders = (config.watchFolders || []).filter(
  (folder) => !folder.includes(".local")
);

module.exports = config;
