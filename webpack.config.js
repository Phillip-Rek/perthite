const path = require('path');

module.exports = {
    entry: './src/codeGen.ts',
    devServer: {
        contentBase: path.join(__dirname, '.'),
        compress: false,
        port: 9000
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }, ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx', '.css'],
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'src'),
    },
    mode: 'development'
};