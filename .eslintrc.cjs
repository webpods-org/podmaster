module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  overrides: [
    {
      files: ["*.ts"],
      rules: {
        "@typescript-eslint/no-empty-function": "off",
      },
    },
  ],
};
