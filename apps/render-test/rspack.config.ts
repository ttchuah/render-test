const { composePlugins, withNx, withReact } = require('@nx/rspack');
const { DefinePlugin, BannerPlugin } = require('@rspack/core');
// const dotenv = require("dotenv");

// // Load env variables from .env.
// const env = dotenv.config().parsed;


// Prepare environment variables in a format that DefinePlugin understands
const envKeys = Object.keys(process.env).reduce((acc, key) => {

  // Doing this instead of overwriting the process object
  // because this could break other modules that expect other values
  // in the process object to be defined.
  acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
  return acc;
}, {});

console.log('envKeys', process.env);

module.exports = composePlugins(withNx(), withReact(), (config) => {
  // return {
  //   ...config,
  //   plugins: [
  //     // new rspack.DefinePlugin(envKeys)
  //     new BannerPlugin({
  //       banner: "adf",
  //       footer: true
  //     })
  //   ]
  // }
  config.plugins = [
    ...(config.plugins || []),
    new DefinePlugin(envKeys),  // Add DefinePlugin to inject env variables
    // new DefinePlugin({
    //   'process.env.blah': JSON.stringify('blah')
    // }),
    // new DefinePlugin({
    //   'process.env': 
    // })

  ];

  return config;
});
