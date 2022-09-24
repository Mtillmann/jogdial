import pkg from './package.json';

export default [
    // browser-friendly UMD build
    {
        input: 'src/JogDial.js',
        output: {
            exports : 'default',
            name: 'JogDial',
            file: pkg.browser,
            format: 'umd'
        }
    },
    {
        input: 'src/JogDial.js',
        output: {
            exports : 'default',
            name: 'JogDial',
            file: 'demo/jogdial.js',
            format: 'umd'
        }
    },
    {
        input: 'src/JogDial.js',
        output: [
            {exports : 'default',file: pkg.main, format: 'cjs'},
            {exports : 'default',file: pkg.module, format: 'es'}
        ]
    }
];