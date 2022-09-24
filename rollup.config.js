import pkg from './package.json';

export default [
    // browser-friendly UMD build
    {
        input: 'src/JogDial.js',
        output: {
            name: 'JogDial',
            file: pkg.browser,
            format: 'umd'
        }
    },
    {
        input: 'src/JogDial.js',
        output: {
            name: 'JogDial',
            file: 'demo/jogdial.js',
            format: 'umd'
        }
    },
    {
        input: 'src/JogDial.js',
        output: [
            {file: pkg.main, format: 'cjs'},
            {file: pkg.module, format: 'es'}
        ]
    }
];