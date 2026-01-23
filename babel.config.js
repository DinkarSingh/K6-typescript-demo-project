module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          // k6 uses goja, which supports ES6
          esmodules: true,
        },
        modules: 'commonjs',
      },
    ],
    [
      '@babel/preset-typescript',
      {
        // Allow importing .ts files without extension
        allowDeclareFields: true,
      },
    ],
  ],
};
