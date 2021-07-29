var path = require('path');

module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    entry:
        {

            "js": "./src/renderer.ts"
        },
    target: 'electron-renderer',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
    },
    // Put your normal webpack config below here
    module: {
        rules: require('./webpack.rules'),
    },
    resolve: {
        extensions: [ '.ts',  '.tsx']
    },
};