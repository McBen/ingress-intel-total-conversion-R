module.exports = {
    plugins: {
        "postcss-import": {},
        "postcss-css-variables": {},
        "postcss-nested": {},
        "cssnano": { preset: 'default' },
        "postcss-image-inliner": {
            strict: true,
            maxFileSize: 0,
            assetPaths: [
                './assets/',
                './core/', './core/external/',
                './plugins/', './plugins/external'
            ]
        },
        tailwindcss: {},
        autoprefixer: {},
    }
};
