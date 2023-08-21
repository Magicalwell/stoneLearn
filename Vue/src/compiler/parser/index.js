import { parseHTML } from './html-parser'
import { isIE, isEdge, isServerRendering } from 'core/util/env'
import { getAndRemoveAttr, pluckModuleFunction } from '../helpers'
import { extend } from 'shared/util'
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g
export let warn
let preTransforms
let platformIsPreTag
export function createASTElement(
    tag,
    attrs,
    parent
) {
    return {
        type: 1,
        tag,
        attrsList: attrs,
        attrsMap: makeAttrsMap(attrs),
        rawAttrsMap: {},
        parent,
        children: []
    }
}
export function parse(template, options) {
    // warn = options.warn || baseWarn
    platformIsPreTag = options.isPreTag || ((tag) => tag === 'pre')
    const stack = []
    let root
    let currentParent
    let inVPre = false
    let inPre = false
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
    function closeElement() {
        // 确保元素节点的末尾不会包含空格字符所对应的文本节点
        trimEndingWhitespace(element)
    }
    function trimEndingWhitespace(el) {
        if (!inPre) {
            let lastNode
            while (
                (lastNode = el.children[el.children.length - 1]) &&
                lastNode.type === 3 &&
                lastNode.text === ' '
            ) {
                el.children.pop()
            }
        }
    }
    parseHTML(template, {
        expectHTML: options.expectHTML,
        isUnaryTag: options.isUnaryTag,
        canBeLeftOpenTag: options.canBeLeftOpenTag,
        shouldDecodeNewlines: options.shouldDecodeNewlines,
        shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
        shouldKeepComment: options.comments,
        outputSourceRange: options.outputSourceRange,
        start(tag, attrs, unary, start, end) {
            // parseHTML用来分割解析html字符串，整理为一个标准的层级结构，然后外面会传递过来几个方法，在每个html解析阶段调用
            let element = createASTElement(tag, attrs, currentParent)
            if (!root) {
                root = element
            }
            console.log(element, '>>>>>>>>>>');
            // 判断是否是该忽略的标签和是否在服务端环境
            if (isForbiddenTag(element) && !isServerRendering()) {
                element.forbidden = true
            }
            // 在编译阶段之前，先对模板的 AST 进行一些预转换操作  具体根据不同的模块进行具体的操作，一般来说这里
            // preTransforms数组中函数的值来自于createcomplier函数的参数，module的模块有解析class model style
            for (let i = 0; i < preTransforms.length; i++) {
                element = preTransforms[i](element, options) || element
            }
            // v-pre的处理
            if (!inVPre) {
                processPre(element)
                if (element.pre) {
                    inVPre = true
                }
            }
            // 函数判断当前元素的标签名是否是 <pre>
            if (platformIsPreTag(element.tag)) {
                inPre = true
            }
            if (inVPre) {
                // 将元素的原始属性列表转换为属性对象数组，并对每个属性进行处理和转换。
                processRawAttrs(element)
            } else if (!element.processed) {
                // 这里就能看明白v-for 和 v-if的优先级
                processFor(element)
                // processIf(element)
                // processOnce(element)
                console.log(element, 'forforforforfor');
            }

            if (!root) {
                root = element
            }

            if (!unary) {
                currentParent = element
                stack.push(element)
            } else {
                closeElement(element)
            }
        },
    })
    return root
}
function makeAttrsMap(attrs) {
    const map = {}
    for (let i = 0, l = attrs.length; i < l; i++) {
        map[attrs[i].name] = attrs[i].value
    }
    return map
}
function processPre(el) {
    if (getAndRemoveAttr(el, 'v-pre') != null) {
        el.pre = true
    }
}
function processRawAttrs(el) {
    const list = el.attrsList
    const len = list.length
    if (len) {
        const attrs = el.attrs = new Array(len)
        for (let i = 0; i < len; i++) {
            attrs[i] = {
                name: list[i].name,
                value: JSON.stringify(list[i].value)
            }
            if (list[i].start != null) {
                attrs[i].start = list[i].start
                attrs[i].end = list[i].end
            }
        }
    } else if (!el.pre) {
        el.plain = true
    }
}
export function parseFor(exp) {
    // 通过正则表达式匹配到v-for的格式   v-for="a in b"   v-for="(index,i) of b"
    const inMatch = exp.match(forAliasRE)
    if (!inMatch) return
    const res = {}
    res.for = inMatch[2].trim()
    const alias = inMatch[1].trim().replace(stripParensRE, '')  //stripParensRE正则用于匹配左括号或右括号，并去除
    const iteratorMatch = alias.match(forIteratorRE)  // 用于解构迭代源的别名以及其它可能存在的取值方式
    if (iteratorMatch) {
        res.alias = alias.replace(forIteratorRE, '').trim()
        res.iterator1 = iteratorMatch[1].trim()
        if (iteratorMatch[2]) {
            res.iterator2 = iteratorMatch[2].trim()
        }
    } else {
        res.alias = alias
    }
    return res
}
export function processFor(el) {
    let exp
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
        const res = parseFor(exp)
        if (res) {
            extend(el, res)
        }
    }
}
function isForbiddenTag(el) {
    return (
        el.tag === 'style' ||
        (el.tag === 'script' && (
            !el.attrsMap.type ||
            el.attrsMap.type === 'text/javascript'
        ))
    )
}