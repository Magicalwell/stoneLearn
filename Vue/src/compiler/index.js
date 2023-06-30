import { createCompilerCreator } from './create-compiler'
import { parse } from './parser/index'

export const createCompiler = createCompilerCreator(function baseCompile(
    template,
    options
) {
    console.log(template,options,'----------ddd-------');
    const ast = parse(template.trim(), options)
    if (options.optimize !== false) {
        optimize(ast, options)
    }
    const code = generate(ast, options)
    return {
        ast,
        render: code.render,
        staticRenderFns: code.staticRenderFns
    }
})