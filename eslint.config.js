import globals from "globals"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"
import fs from "node:fs"
import js from "@eslint/js"
import configPrettier from "eslint-config-prettier"
import pluginPrettier from "eslint-plugin-prettier"

const readJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    return JSON.parse(content)
  } catch (error) {
    console.error(`Error reading or parsing JSON file at ${filePath}:`, error)
    return {}
  }
}

const autoImportConfig = readJsonFile("./.eslintrc-auto-import.json")

export default [
  {
    ...js.configs.recommended,
    ignores: ["dist/**", "node_modules/**", ".eslintrc-auto-import.json"],
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      ...configPrettier.rules,
      ...pluginPrettier.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...(autoImportConfig.globals || {}),
        chrome: "readonly",
      },
    },
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        defineProps: "readonly",
        defineEmits: "readonly",
        defineExpose: "readonly",
        withDefaults: "readonly",
      },
    },
  },
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "warn",
      "vue/max-attributes-per-line": "off",
      "vue/require-default-prop": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/no-v-html": "off",
      "vue/html-indent": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": "off",
    },
  },
]
