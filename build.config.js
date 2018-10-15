const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/app',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "st-dashboard.js",
    libraryTarget: "umd",
    library: "StDashboardDev",
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
        exclude: /\/node_modules/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader?importLoaders=1' },
          { loader: 'autoprefixer-loader?browsers=last 2 versions' },
          { loader: 'less-loader' }
        ]
      }, {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      }, {
        test: /\.(eot|woff|woff2|ttf|svg)?$/,
        use: [
          { loader: "file-loader?name=[path][name].[ext]" }
        ]
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
      $: 'jquery',
      jQuery: 'jquery',
      "window.jQuery": 'jquery'
    })
  ]
};
