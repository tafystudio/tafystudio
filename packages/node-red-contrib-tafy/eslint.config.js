module.exports = [
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**", "*.min.js"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
      globals: {
        // Node.js globals
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        console: "readonly",
        exports: "readonly",
        global: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
        // Node-RED globals
        RED: "readonly"
      }
    },
    rules: {
      // Possible Errors
      "no-console": "off", // Node-RED nodes often use console
      "no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      
      // Best Practices
      "curly": ["error", "all"],
      "eqeqeq": ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      
      // Stylistic Issues
      "indent": ["error", 4],
      "quotes": ["error", "single", { "avoidEscape": true }],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "never"],
      "brace-style": ["error", "1tbs"],
      
      // ES6
      "prefer-const": "error",
      "no-var": "error",
      
      // Node-RED specific
      "no-process-exit": "off" // Node-RED nodes may need process control
    }
  }
];