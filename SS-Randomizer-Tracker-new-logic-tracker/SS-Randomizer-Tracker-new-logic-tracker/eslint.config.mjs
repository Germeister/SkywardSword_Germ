import react from '@eslint-react/eslint-plugin';
import { fixupPluginRules } from '@eslint/compat';
import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { name: 'eslint/recommended', ...eslint.configs.recommended },
    importPlugin.flatConfigs.recommended,
    reactPlugin.configs.flat['jsx-runtime'],
    {
        name: 'typescript-eslint/parser-options',
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    ...tseslint.configs.recommendedTypeChecked,
    {
        name: 'sonarjs/recommended',
        ...sonarjs.configs.recommended,
        rules: {
            'sonarjs/no-alphabetical-sort': 'error',
            'sonarjs/no-dead-store': 'error',
            'sonarjs/no-redundant-jump': 'error',
            'sonarjs/no-duplicated-branches': 'error',
            'sonarjs/prefer-immediate-return': 'error',
        },
    },
    {
        name: 'react',
        ...reactPlugin.configs.flat.recommended,
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        name: 'react-hooks',
        plugins: {
            'react-hooks': fixupPluginRules(reactHooks),
        },
        rules: reactHooks.configs.recommended.rules,
    },
    {
        name: 'jsx-a11y',
        files: ['**/*.tsx'],
        plugins: {
            'jsx-a11y': fixupPluginRules(jsxA11y),
        },
        rules: {
            'jsx-a11y/aria-props': 'error',
            'jsx-a11y/aria-proptypes': 'error',
            'jsx-a11y/aria-role': 'error',
            'jsx-a11y/aria-unsupported-elements': 'error',
            'jsx-a11y/autocomplete-valid': 'error',
            'jsx-a11y/label-has-associated-control': 'error',
            'jsx-a11y/no-noninteractive-element-interactions': 'error',
            'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
            'jsx-a11y/no-noninteractive-tabindex': 'error',
            'jsx-a11y/no-redundant-roles': 'error',
            'jsx-a11y/role-has-required-aria-props': 'error',
            'jsx-a11y/role-supports-aria-props': 'error',
        },
    },
    {
        name: 'eslint-react',
        ...react.configs['recommended-type-checked'],
    },
    {
        name: 'ss-randomizer-tracker-custom',
        files: ['**/*.{js,jsx,ts,tsx}'],
        rules: {
            'max-len': 0,
            'no-unused-vars': 'off',
            'no-param-reassign': ['error'],
            'no-bitwise': ['off'],
            eqeqeq: ['error', 'always'],
            'no-debugger': 'error',
            'no-implicit-coercion': 'error',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['testing/*'],
                            message:
                                'You cannot use test helpers in regular code.',
                        },
                    ],
                    paths: [
                        {
                            name: 'es-toolkit',
                            importNames: [
                                'mapValues',
                                'isEmpty',
                                'noop',
                                'stubTrue',
                                'stubFalse',
                            ],
                            message: 'Please use functions from utils instead.',
                        },
                        {
                            name: 'es-toolkit',
                            importNames: ['sortBy'],
                            message:
                                'Please use .sort with functions from utils/Compare',
                        },
                    ],
                },
            ],
            'no-restricted-globals': [
                'error',
                'alert',
                'confirm',
                'prompt',
                'name',
                'location',
                'history',
                'menubar',
                'scrollbars',
                'statusbar',
                'toolbar',
                'status',
                'closed',
                'frames',
                'length',
                'top',
                'opener',
                'parent',
                'origin',
                'external',
                'screen',
                'defaultstatus',
                'crypto',
                'close',
                'find',
                'focus',
                'open',
                'print',
                'scroll',
                'stop',
                'chrome',
                'caches',
                'scheduler',
            ],

            'import/no-cycle': ['error', { ignoreExternal: true }],

            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/no-unescaped-entities': 'off',
            'react/jsx-no-target-blank': 'off',
            'react/display-name': 'off',
            'react/prefer-stateless-function': 'warn',
            'react/no-access-state-in-setstate': 'error',
            'react/no-this-in-sfc': 'error',
            'react/no-children-prop': 'error',
            'react/no-unused-state': 'error',
            'react/button-has-type': 'error',
            'react/prop-types': 'off',
            'react/self-closing-comp': 'error',
            'react/function-component-definition': 'error',
            'react/no-redundant-should-component-update': 'error',
            'react/no-unsafe': 'error',
            'react/jsx-no-constructed-context-values': 'error',
            'react/jsx-pascal-case': 'error',
            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                    children: 'never',
                    propElementValues: 'always',
                },
            ],
            'react/iframe-missing-sandbox': 'error',
            'react/jsx-key': 'off',

            '@eslint-react/prefer-read-only-props': 'off',
            '@eslint-react/no-array-index-key': 'off',
            '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect':
                'off',

            '@typescript-eslint/consistent-type-assertions': 'warn',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/unbound-method': 'off',

            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/rules-of-hooks': 'error',
        },
        settings: {
            'import/resolver': {
                ...importPlugin.configs.typescript.settings['import/resolver'],
            },
            'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
        },
    },
    {
        name: 'tests',
        files: ['**/*.test.ts'],
        rules: {
            // We don't want to allow importing test modules in app modules, but of course you can do it in other test modules.
            'no-restricted-imports': 'off',
        },
    },
);
