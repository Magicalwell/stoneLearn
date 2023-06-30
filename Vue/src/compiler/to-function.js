
function createFunction (code, errors) {
    try {
      return new Function(code)
    } catch (err) {
      errors.push({ err, code })
      return noop
    }
  }
  
export function createCompileToFunctionFn(compile) {
    const cache = Object.create(null)
    return function compileToFunctions(template, options, vm) {
        console.log(template, options, vm, 'template, options, vm');
        //delimiters为插值的分隔符，这里直接把字符串缓存到cache里面
        const key = options.delimiters
            ? String(options.delimiters) + template
            : template
        if (cache[key]) {
            return cache[key]
        }
        const compiled = compile(template, options)
        const res = {}
        const fnGenErrors = []
        res.render = createFunction(compiled.render,fnGenErrors)
        res.staticRenderFns = function () { }
        return (cache[key] = res)
    }
}