const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        background: './src/background/index.ts',
        contentScript: './src/content/contentScript.ts'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    }
};
