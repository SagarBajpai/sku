// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

const copyPublicFiles = require('../lib/copyPublicFiles');
const webpackCompiler = require('../config/webpack/webpack.config');
const { paths } = require('../context');

const compile = () => {
  return new Promise((resolve, reject) => {
    webpackCompiler.run((error, stats) => {
      console.log(
        stats.toString({
          chunks: false, // Makes the build much quieter
          children: false,
          colors: true
        })
      );

      if (error || stats.hasErrors()) {
        // Webpack has already printed the errors, so we just need to stop execution.
        reject();
      }

      const info = stats.toJson();

      if (stats.hasWarnings()) {
        info.warnings.forEach(console.warn);
      }

      resolve();
    });
  });
};

const cleanDistFolders = () => rimraf(`${paths.target}/*`);

const cleanRenderJs = () => rimraf(path.join(paths.target, 'render.js'));

cleanDistFolders()
  .then(compile)
  .then(cleanRenderJs)
  .then(copyPublicFiles)
  .then(() => console.log('Sku build complete!'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
