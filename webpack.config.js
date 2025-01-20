// webpack.config.js
const path = require("path");
const ShebangPlugin = require("webpack-shebang-plugin");

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new ShebangPlugin()], // ENSURE THE SHEBANG IS IN THE OUTPUT AND THE FILE IS EXECUTABLE
  resolve: {
    extensions: [".ts", ".js"],
  },
  target: "node",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  // Additional configuration goes here
};
