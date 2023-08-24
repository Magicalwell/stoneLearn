const buble = require('rollup-plugin-buble')
// buble内涵es6转es5等一系列依赖的组合包
const alias = require('@rollup/plugin-alias')
// 用于处理path路径的问题，通过路径映射
const path = require('path')
const replace = require('@rollup/plugin-replace')
// replace插件是用来替换一些全局变量
const aliases = require('./alias')
const featureFlags = require('./feature-flags')
const resolve = p => {
    const base = p.split('/')[0]
    if (aliases[base]) {
        return path.resolve(aliases[base], p.slice(base.length + 1))
    } else {
        return path.resolve(__dirname, '../', p)
    }
}
// builds保存不同环境的rollup配置设置，通过--environment TARGET:full-dev
const builds = {
    // Runtime+compiler development build (Browser)
    'web-full-dev': {
        // entry: resolve('web/entry-runtime.js'),
        entry: resolve('web/entry-runtime-with-compiler.js'),
        dest: resolve('dist/bundle.cjs.js'),
        format: 'umd',
        env: 'development',
    },
}


function genConfig(name) {
    const opts = builds[name]
    const config = {
        input: opts.entry,
        output: {
            file: opts.dest,
            format: opts.format,
            name: opts.moduleName || 'Vue',
            exports: 'auto'
        },
        plugins: [
            replace({ preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify('development') }),
            alias({
                entries: Object.assign({}, aliases)
            }),
            buble()
        ]
    }
    const vars = {
        // __WEEX__: !!opts.weex,
        // __WEEX_VERSION__: weexVersion,
        // __VERSION__: version
    }
    // feature flags
    Object.keys(featureFlags).forEach(key => {
        vars[`process.env.${key}`] = featureFlags[key]
    })
    console.log(vars,'varsvars');
    config.plugins.push(replace(vars))

    if (opts.transpile !== false) {
        config.plugins.push(buble())
    }
    return config
}
module.exports = genConfig(process.env.TARGET)