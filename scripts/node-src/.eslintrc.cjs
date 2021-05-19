module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
    },
    rules: {
        // '@typescript-eslint/array-type': 'off',
        // 'arrow-parens': 'off',
        // 'no-restricted-imports': [
        //     'error',
        //     {
        //         paths: [
        //             {
        //                 name: 'rxjs/Rx',
        //                 message: "Please import directly from 'rxjs' instead",
        //             },
        //         ],
        //     },
        // ],
        // '@typescript-eslint/interface-name-prefix': 'off',
        // 'max-classes-per-file': 'off',
        // 'max-len': ['error', { code: 140 }],
        // '@typescript-eslint/explicit-member-accessibility': 'off',
        // '@typescript-eslint/member-ordering': [
        //     'error',
        //     {
        //         default: ['static-field', 'instance-field', 'static-method', 'instance-method'],
        //     },
        // ],
        // 'no-multiple-empty-lines': 'off',
        // 'no-restricted-syntax': [
        //     'error',
        //     {
        //         selector: 'CallExpression[callee.object.name="console"][callee.property.name=/^(debug|info|time|timeEnd|trace)$/]',
        //         message: 'Unexpected property on console object was called',
        //     },
        // ],
        // '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
        // '@typescript-eslint/no-non-null-assertion': 'error',
        // 'no-fallthrough': 'error',
        // '@typescript-eslint/no-var-requires': 'off',
        // define new rules in `prettierrc.js` if possible, not here
    },
};
