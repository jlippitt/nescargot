const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
          },
          {
            loader: 'string-replace-loader',
            options: {
              search: 'debug\\(.*\\);',
              replace: '',
              flags: 'g',
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.worklet\.js$/,
        use: { loader: 'worklet-loader' }
      },
    ]
  },
  node: {
    fs: 'empty',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    modules: ['./src', './node_modules'],
  },
  output: {
    filename: 'nescargot.js',
    path: path.resolve(__dirname, 'public'),
  }
};
