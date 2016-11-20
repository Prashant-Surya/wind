var ProvidePlugin = require('webpack').ProvidePlugin;
var path = require('path');
const webpack = require('webpack');

module.exports = {
    target: 'node',
    entry: {
        wind: './src/core/index.js'
    },

    output: {
        library: "Wind",
        path: "./build/",
        filename: "[name]/[name].js",
        libraryTarget: "umd"

    },

    module: {
        loaders: [{
            test: /\.js$/,
            //exclude: /node_modules/,
            loader: 'babel'
            }
        ]
    },

    resolve: {
        extensions: ['', '.js'],
        root: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules'),
        ],
        modulesDirectories: ['node_modules'],
    }
};
