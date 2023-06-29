import { createCompileToFunctionFn } from './to-function'

export function createCompilerCreator(baseCompile) {
    return function createCompiler(baseOptions) {
        function compile(template, options) {
            const compiled = baseCompile(template.trim())
            return compiled
        }
        return {
            compile,
            compileToFunctions: createCompileToFunctionFn(compile)
        }
    }
}