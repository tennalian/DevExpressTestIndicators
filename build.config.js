const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/app',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "st-dashboard.js",
    libraryTarget: "umd",
    library: "StDashboard",
  },
	devtool: "#source-map",
	module: {
    rules: [
      {
        test:  /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ["es2015"],
              plugins: ['transform-es2015-classes']
            }
          }
        ],
        exclude: /node_modules/
      }, {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader?importLoaders=1' },
          { loader: 'autoprefixer-loader?browsers=last 2 versions' },
          { loader: 'less-loader' }
        ],
        exclude: /\/node_modules/
      }, {
        test: /\.(png|jpeg)$/,
        use: [
          { loader: 'url-loader', options: { limit: 8192 } }
        ]
      }
    ]
  },
	plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.ProvidePlugin({
      d3: 'd3',
    })
  ]
};
