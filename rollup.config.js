import pkg from './package.json';
import copy from 'rollup-plugin-copy';
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
            file: 'docs/jogdial.js',
            format: 'umd'
        },
        plugins: [
            copy({
                targets: [
                    { src: 'src/JogDial.css', dest: 'docs' }
                ]
            })
        ]
    },
    {
        input: 'src/JogDial.js',
        output: [
            {exports : 'default',file: pkg.main, format: 'cjs'},
            {exports : 'default',file: pkg.module, format: 'es'}
        ]
    }
];