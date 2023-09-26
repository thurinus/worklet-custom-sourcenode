const ReactRefreshPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = function override(config, env) {
  // this is needed specifically to address the injection of extra code into worklets
  // during `yarn start`, which was causing the `importScripts` error.
  // from: https://github.com/webpack/webpack/issues/11543#issuecomment-1585715108
  if (env === "development") {
    config.plugins = config.plugins.filter(
      (plugin) => plugin.constructor.name !== "ReactRefreshPlugin"
    );
    config.plugins.push(
      new ReactRefreshPlugin({
        overlay: false,
        exclude: /(node_modules)|(.+\.worklet\.(ts|js)$)/i,
        include: /\.([cm]js|[jt]sx?|flow)$/i,
      })
    );
  }

  config.module.parser = {
    javascript: {
      worker: [
        "*context.audioWorklet.addModule()",
        "*audioWorklet.addModule()",
        // *addModule() is not valid syntax
        "...",
      ],
    },
  };

  return config;
};
