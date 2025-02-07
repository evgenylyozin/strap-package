import path from "path";

const __dirname = path.resolve();
import ShebangPlugin from "webpack-shebang-plugin";

export default {
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
  plugins: [
    new ShebangPlugin(), // ENSURE THE SHEBANG IS IN THE OUTPUT AND THE FILE IS EXECUTABLE
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
  target: "node",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
};
