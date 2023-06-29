import Vue from './runtime/index'
import { query } from './util/index'
import { cached } from 'core/util/index'
import { compileToFunctions } from './compiler/index'
const idToTemplate = cached(id => {
    const el = query(id)
    return el && el.innerHTML
})

// 下面的mount保存的是Vue构造函数上面提供的mount，就是调用了mountComponent
const mount = Vue.prototype.$mount
console.log(mount, '+++++++++++');
Vue.prototype.$mount = function (el, hydrating) {
    el = el && query(el)
    if (el === document.body || el === document.documentElement) {
        return this
    }
    const options = this.$options
    if (!options.render) {
        // 没有给render的情况下，判断有没有template，render优先级高一些
        let template = options.template
        // 这里第一个template的判断逻辑可以看作是提前处理template
        if (template) {
            if (typeof template === 'string') {
                if (template.charAt(0) === '#') {
                    //兼容模板是#app这种选择器的情况
                    template = idToTemplate(template)
                }
            } else if (template.nodeType) {
                template = template.innerHTML
            } else {
                return this
            }
        } else if (el) {
            template = getOuterHTML(el)
        }
        if (template) {
            // compileToFunctions方法接受模板和配置参数，返回render，具体看实现
            const { render, staticRenderFns } = compileToFunctions(template, {
                outputSourceRange: process.env.NODE_ENV !== 'production',
                shouldDecodeNewlines: true,
                shouldDecodeNewlinesForHref: true,
                delimiters: undefined,
                comments: undefined
            }, this)
            options.render = render
            options.staticRenderFns = staticRenderFns
        }
    }
    return mount.call(this, el, hydrating)
}
function getOuterHTML(el) {
    if (el.outerHTML) {
        return el.outerHTML
    } else {
        const container = document.createElement('div')
        container.appendChild(el.cloneNode(true))
        return container.innerHTML
    }
}
Vue.compile = compileToFunctions
export default Vue