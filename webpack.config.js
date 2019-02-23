const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
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