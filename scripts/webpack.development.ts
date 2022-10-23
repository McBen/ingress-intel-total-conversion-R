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
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        exclude: /(node_modules|\.spec\.js)/,
        use: [{
          loader: 'webpack-strip-block',
          options: {
            start: 'RELEASE-START',
            end: 'RELEASE-END'
          }
        }]
      },
    ]
  },

});
