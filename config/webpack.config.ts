import { AotPlugin, AotPluginOptions } from '@ngtools/webpack';
import * as webpack from 'webpack';
import * as merge from 'webpack-merge';
import * as html from 'html-webpack-plugin';
import * as copy from 'copy-webpack-plugin';
import * as extract from 'extract-text-webpack-plugin';
import * as compression from 'compression-webpack-plugin';
import { root } from './helpers/utils';

const entryPoints: string[] = ['inline', 'polyfills', 'styles', 'vendor', 'app'];
const nodeModules = root('node_modules');

export interface BuildOptions {
  aot: boolean;
}

export default function(options: BuildOptions, webpackOptions: any) {
  options = options || { aot: false };

  let config: any;

  config = {
    entry: {
      app: root('./src/main.ts')
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      modules: ['node_modules', nodeModules]
    },
    resolveLoader: {
      modules: [nodeModules, 'node_modules']
    },
    output: {
      path: root('build'),
      filename: '[name].bundle.js',
      chunkFilename: '[id].chunk.js'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: '@ngtools/webpack'
        },
        {
          test: /\.html$/,
          loader: 'raw-loader'
        },
        { 
          test: /\.json$/,
          loader: 'json-loader'
        },
        { 
          test: /\.(jp?g|png|gif)$/,
          loader: 'file-loader',
          options: { hash: 'sha512', digest: 'hex', name: 'images/[hash].[ext]' }
        },
        {
          test: /\.(eot|woff2?|svg|ttf|otf)([\?]?.*)$/,
          loader: 'file-loader',
          options: { hash: 'sha512', digest: 'hex', name: 'fonts/[hash].[ext]' }
        },
        { 
          test: /\.css$/, 
          use: extract.extract({ fallback: 'style-loader', use: 'css-loader' }), 
          include: [root('src/styles')] 
        },
        { 
          test: /\.css$/, 
          use: ['to-string-loader', 'css-loader'], 
          exclude: [root('src/styles')] 
        },
        { 
          test: /\.scss$|\.sass$/,
          loader: extract.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader'] }),
          exclude: [root('src/app')]
        },
        {
          test: /\.scss$|\.sass$/,
          use: ['to-string-loader', 'css-loader', 'sass-loader'],
          exclude: [root('src/styles')]
        }
      ]
    },
    plugins: [
      new AotPlugin({
        tsConfigPath: root('./src/tsconfig.json'),
        entryModule: root('./src/app/app.module#AppModule'),
        skipCodeGeneration: !options.aot
      }),
      new copy([{ context: './src/assets', from: '**/*' }]),
      new html({
        template: root('src/index.html'),
        output: root('build'),
        chunksSortMode: (left, right) => {
          let leftIndex = entryPoints.indexOf(left.names[0]);
          let rightindex = entryPoints.indexOf(right.names[0]);
          if (leftIndex > rightindex) {
            return 1;
          } else if (leftIndex < rightindex) {
            return -1;
          } else {
            return 0;
          }
        }
      }),
      new extract('css/[hash].css')
    ]
  };

  if (webpackOptions.p) {
    config = merge({}, config, {
      plugins: [
        new compression({ 
          asset: '[path].gz[query]',
          algorithm: 'gzip',
          test: /\.js$|\.html$/,
          threshold: 10240,
          minRatio: 0.8
        })
      ]
    });
  } else {
    config = merge({}, config, {
      devtool: 'inline-source-map',
      module: {
        rules: [
          { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader', exclude: [nodeModules] }
        ]
      },
      plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
          minChunks: Infinity,
          name: 'inline'
        }),
        new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          chunks: ['app'],
          minChunks: module => {
            return module.resource && module.resource.startsWith(nodeModules)
          }
        })
      ]
    });
  }
  
  return config;
}
