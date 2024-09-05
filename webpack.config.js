const path = require('path');

module.exports = {
    entry: './simulation.ts',
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: 'sim_bundle.js',
        sourceMapFilename: "./sim_bundle.js.map"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.png$/i,
                use: 'url-loader',
            }

        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devServer: {
        static: path.join(__dirname, './'),
        compress: true,
        port: 9000,
        watchFiles: ['./src/**/*.ts'],
    }
}
