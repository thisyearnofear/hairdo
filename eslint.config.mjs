import nextConfig from "eslint-config-next"

// Merge custom rules into the config that has the @typescript-eslint plugin
const tsConfigIndex = nextConfig.findIndex(
  (c) => c.plugins && c.plugins["@typescript-eslint"]
)

if (tsConfigIndex !== -1) {
  nextConfig[tsConfigIndex].rules = {
    ...nextConfig[tsConfigIndex].rules,
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  }
}

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // New React 19 rules — downgrade to warn for existing code patterns
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]

export default eslintConfig
