const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { getPathFromCwd } = require('../lib/cwd');
const args = require('../config/args');
const defaultSkuConfig = require('./defaultSkuConfig');
const defaultClientEntry = require('./defaultClientEntry');
const validateConfig = require('./validateConfig');
const defaultCompilePackages = require('./defaultCompilePackages');
const isCompilePackage = require('../lib/isCompilePackage');

const appSkuConfigPath = getPathFromCwd(args.config);

const appSkuConfig = fs.existsSync(appSkuConfigPath)
  ? require(appSkuConfigPath)
  : {};

const skuConfig = {
  ...defaultSkuConfig,
  ...appSkuConfig,
};

validateConfig(skuConfig);

if (isCompilePackage && skuConfig.rootResolution) {
  console.log(
    chalk.red(
      `Error: "${chalk.bold(
        'rootResolution',
      )}" is not safe for compile packages as consuming apps can't resolve them.`,
    ),
  );
  process.exit(1);
}

const env = {
  ...skuConfig.env,
  SKU_TENANT: args.tenant,
};

const isStartScript = args.script === 'start-ssr' || args.script === 'start';
const isBuildScript = args.script === 'build-ssr' || args.script === 'build';

const normalizeRoute = (route) =>
  typeof route === 'string' ? { route } : route;

const normalizedRoutes = skuConfig.routes.map(normalizeRoute);

skuConfig.sites.forEach((site, siteIndex) => {
  if (site.routes) {
    normalizedRoutes.push(
      ...site.routes.map((route) => ({
        ...normalizeRoute(route),
        siteIndex,
      })),
    );
  }
});

if (normalizedRoutes.length === 0) {
  normalizedRoutes.push({ name: 'default', route: '/' });
}

const normalizedLanguages = skuConfig.languages
  ? skuConfig.languages.map((lang) =>
      typeof lang === 'string' ? { name: lang } : lang,
    )
  : null;

const startTransformPath = ({ site = '', route = '' }) =>
  path.join(site, route);

const transformOutputPath = isStartScript
  ? startTransformPath
  : skuConfig.transformOutputPath;

const getSetupTests = (setupTests) => {
  if (!setupTests) {
    return [];
  }

  if (Array.isArray(setupTests)) {
    return setupTests.map((setupTest) => getPathFromCwd(setupTest));
  }

  return [getPathFromCwd(setupTests)];
};

// normalize sites to object syntax
const sites = skuConfig.sites.map((site) =>
  typeof site === 'string' ? { name: site } : site,
);

// Default initialPath to the first route
const initialPath = skuConfig.initialPath || normalizedRoutes[0].route;

const publicPath = skuConfig.publicPath.endsWith('/')
  ? skuConfig.publicPath
  : `${skuConfig.publicPath}/`;

const devServerMiddleware =
  skuConfig.devServerMiddleware &&
  getPathFromCwd(skuConfig.devServerMiddleware);

const useDevServerMiddleware = devServerMiddleware
  ? fs.existsSync(devServerMiddleware)
  : false;

if (devServerMiddleware && !useDevServerMiddleware) {
  throw new Error(
    `${devServerMiddleware} does not exist. Please create the file or remove 'devServerMiddleware' from your sku config.`,
  );
}

const paths = {
  devServerMiddleware,
  src: skuConfig.srcPaths.map(getPathFromCwd),
  compilePackages: [...defaultCompilePackages, ...skuConfig.compilePackages],
  clientEntry: getPathFromCwd(skuConfig.clientEntry),
  renderEntry: getPathFromCwd(skuConfig.renderEntry),
  libraryEntry: skuConfig.libraryEntry
    ? getPathFromCwd(skuConfig.libraryEntry)
    : null,
  serverEntry: getPathFromCwd(skuConfig.serverEntry),
  public: getPathFromCwd(skuConfig.public),
  relativeTarget: skuConfig.target,
  target: getPathFromCwd(skuConfig.target),
  relativeTarget: skuConfig.target,
  publicPath: isStartScript ? '/' : publicPath,
  setupTests: getSetupTests(skuConfig.setupTests),
  storybookTarget: getPathFromCwd(skuConfig.storybookTarget),
  playroomTarget: getPathFromCwd(skuConfig.playroomTarget),
  playroomComponents: getPathFromCwd(skuConfig.playroomComponents),
  playroomThemes: skuConfig.playroomThemes
    ? getPathFromCwd(skuConfig.playroomThemes)
    : null,
  playroomSnippets: skuConfig.playroomSnippets
    ? getPathFromCwd(skuConfig.playroomSnippets)
    : null,
  playroomFrameComponent: skuConfig.playroomFrameComponent
    ? getPathFromCwd(skuConfig.playroomFrameComponent)
    : null,
  playroomScope: skuConfig.playroomScope
    ? getPathFromCwd(skuConfig.playroomScope)
    : null,
};

module.exports = {
  paths,
  env,
  locales: skuConfig.locales,
  hosts: skuConfig.hosts,
  port: {
    client: skuConfig.port,
    server: skuConfig.serverPort,
  },
  libraryName: skuConfig.libraryName,
  isLibrary: Boolean(skuConfig.libraryEntry),
  storybookPort: skuConfig.storybookPort,
  storybookTarget: skuConfig.storybookTarget,
  provideDefaultChromaticViewports: skuConfig.provideDefaultChromaticViewports,
  polyfills: skuConfig.polyfills,
  initialPath,
  webpackDecorator: skuConfig.dangerouslySetWebpackConfig,
  jestDecorator: skuConfig.dangerouslySetJestConfig,
  eslintDecorator: skuConfig.dangerouslySetESLintConfig,
  routes: normalizedRoutes,
  sites,
  environments: skuConfig.environments,
  transformOutputPath,
  defaultClientEntry,
  isStartScript,
  isBuildScript,
  supportedBrowsers: skuConfig.supportedBrowsers,
  sourceMapsProd: Boolean(skuConfig.sourceMapsProd),
  displayNamesProd: Boolean(skuConfig.displayNamesProd),
  playroom: {
    port: skuConfig.playroomPort,
    widths: skuConfig.playroomWidths,
    title: skuConfig.playroomTitle,
    paramType: skuConfig.playroomParamType,
  },
  orderImports: Boolean(skuConfig.orderImports),
  cspEnabled: skuConfig.cspEnabled,
  cspExtraScriptSrcHosts: skuConfig.cspExtraScriptSrcHosts,
  httpsDevServer: skuConfig.httpsDevServer,
  useDevServerMiddleware,
  rootResolution: skuConfig.rootResolution,
  languages: normalizedLanguages,
};
