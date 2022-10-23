import merge from "webpack-merge";
import configure from "./webpack.config";

export default merge(configure, {
    mode: "production",

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                enforce: 'pre',
                exclude: /(node_modules|\.spec\.js)/,
                use: [{
                    loader: 'webpack-strip-block',
                    options: {
                        start: 'DEBUG-START',
                        end: 'DEBUG-END'
                    }
                }]
            },
        ]
    },

});
