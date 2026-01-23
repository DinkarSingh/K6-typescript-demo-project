const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'first-test': './tests/first-test.ts',
    'api-test': './tests/api-test.ts',
    'load-test': './tests/load-test.ts',
    'stress-test': './tests/stress-test.ts',
    'spike-test': './tests/spike-test.ts',
    'soak-test': './tests/soak-test.ts',
    'volume-test': './tests/volume-test.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  target: 'web',
  externals: /^k6(\/.*)?$/,
  stats: {
    colors: true,
  },
  devtool: 'source-map',
};
