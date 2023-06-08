module.exports = function override(config, env) {
  //do stuff with the webpack config...
  config.module.rules.push({
    test: /\.(js|mjs|jsx|ts|tsx)$/,
    // test: /\.[cm]?(js)$/,
    parser: {
      worker: [
        "*context.audioWorklet.addModule()",
        "*audioWorklet.addModule()",
        // *addModule() is not valid syntax
        "...",
      ],
    },
  });

  return config;
};
