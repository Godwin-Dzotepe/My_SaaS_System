import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts and utilities
    "scripts/**",
    "fix_*.js",
    "update_*.js",
    "check-*.js",
    "create-super-admin.js",
    "check-user.js",
  ]),
  // Custom rules for this project
  {
    name: "custom-rules",
    rules: {
      // Allow any types for dynamic data (common in Next.js API routes)
      "@typescript-eslint/no-explicit-any": "off",
      // Allow require() in JS files (utility scripts)
      "@typescript-eslint/no-require-imports": "off",
      // Be lenient with unused vars (often from incomplete refactoring)
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow @ts-nocheck in seed scripts
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;
