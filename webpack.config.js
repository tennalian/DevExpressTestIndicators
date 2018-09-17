const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/app',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: "st-data.js",
      libraryTarget: "umd",
      library: "StDashboard",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [{
            loader: 'babel-loader',
            options: {
              presets: ["es2015"]
            }
          }],
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
    devtool: "source-map",
    devServer: {
      contentBase: './examples',
      host: 'localhost',
      open: false,
      port: 5000,
      hot: true,
      historyApiFallback: true,
      noInfo: true,
      proxy: {
        '/api': {
          target: 'http://dbsrv.systtech.ru:8009',
          changeOrigin: true,
          auth: "admin:355612"
          // secure: false
        }
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        "window.jQuery": 'jquery'
      })
    ]
};
