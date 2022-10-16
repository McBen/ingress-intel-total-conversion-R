import merge from "webpack-merge";
import configure from "./webpack.config";


export default merge(configure, {
  mode: "development",
  watchOptions: {
    poll: 100,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
    ]
  }
});
