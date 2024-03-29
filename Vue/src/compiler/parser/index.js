import { parseHTML } from './html-parser'
import { isIE, isEdge, isServerRendering } from 'core/util/env'
import {
    getAndRemoveAttr,
    pluckModuleFunction,
    addAttr,
    getRawBindingAttr,
    getAndRemoveAttrByRegex,
    getBindingAttr
} from '../helpers'
import { extend } from 'shared/util'
const slotRE = /^v-slot(:|$)|^#/
const stripParensRE = /^\(|\)$/g
const dynamicArgRE = /^\[.*\]$/
const modifierRE = /\.[^.\]]+(?=[^\]]*$)/g
let transforms
let preTransforms
let platformIsPreTag
export const dirRE = process.env.VBIND_PROP_SHORTHAND
    ? /^v-|^@|^:|^\.|^#/
    : /^v-|^@|^:|^#/
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/

export let warn
export const emptySlotScopeToken = `_empty_`

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
    transforms = pluckModuleFunction(options.modules, 'transformNode')
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
    function closeElement(element) {
        // 确保元素节点的末尾不会包含空格字符所对应的文本节点
        trimEndingWhitespace(element)
        // 判断是否不在v-pre中，且是否没有被处理
        if (!inVPre && !element.processed) {
            // 直接进行AST的解析处理
            element = processElement(element, options)
        }
        // 如果当前栈为空并且当前元素节点不是根节点  用来判断当前是否存在未闭合的非根节点
        // 当遇到一个标签的开始标签，就会入栈，该元素节点闭合时，会弹出栈顶的元素节点
        if (!stack.length && element !== root) {
            // 这里就是允许根节点同级的节点 要以if或else elseif的方式
            if (root.if && (element.elseif || element.else)) {
                addIfCondition(root, {
                    exp: element.elseif,
                    block: element
                })
            }
        }
        //处理当前元素和父元素的关系 同时处理在插槽里面的情况，将具名插槽元素存储在父元素的scopedSlots属性中
        if (currentParent && !element.forbidden) {
            if (element.elseif || element.else) {
                processIfConditions(element, currentParent)
            } else {
                if (element.slotScope) {
                    const name = element.slotTarget || '"default"'
                        ; (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element
                }
                currentParent.children.push(element)
                element.parent = currentParent
            }
        }
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
                processIf(element)
                processOnce(element)
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
        end(tag, start, end) {
            const element = stack[stack.length - 1]
            // pop stack
            stack.length -= 1
            currentParent = stack[stack.length - 1]
            closeElement(element)
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
function processOnce(el) {
    const once = getAndRemoveAttr(el, 'v-once')
    if (once != null) {
        el.once = true
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
// parseHtml的核心就是processElement
export function processElement(element, options) {
    //依次处理key ref slot component attrs
    processKey(element)
    // 标记节点是不是一个普通节点，即不包含任何动态绑定、键值、作用域插槽和属性列表，这样做的目的是
    // 在编译阶段进行优化，减少对这些节点的处理和更新操作，提高渲染性能
    element.plain = (
        !element.key &&
        !element.scopedSlots &&
        !element.attrsList.length
    )
    // 处理ref  把自己的引用挂载element上面  同时检查是否在v-for内，以保证唯一且正确的引用
    processRef(element)
    // 这里处理三种插槽 注意这三种为slot-scope  slot   v-slot    <slot>标签需要在子元素中处理
    processSlotContent(element)
    processSlotOutlet(element)
    // 处理 :is动态组件的情况
    processComponent(element)
    // 下面要进行属性的处理了，先进行预转换
    for (let i = 0; i < transforms.length; i++) {
        element = transforms[i](element, options) || element
    }
    processAttrs(element)
    return element

}
export function addIfCondition(el, condition) {
    if (!el.ifConditions) {
        el.ifConditions = []
    }
    el.ifConditions.push(condition)
}
function processIf(el) {
    const exp = getAndRemoveAttr(el, 'v-if')
    // 获取元素节点上的 v-if 属性的值
    if (exp) {
        // 表示该元素节点是条件渲染的起始节点
        el.if = exp
        // 将条件块的信息添加到元素节点的条件列表中，其中包括条件表达式和当前元素节点本身。
        addIfCondition(el, {
            exp: exp,
            block: el
        })
    } else {
        if (getAndRemoveAttr(el, 'v-else') != null) {
            el.else = true
        }
        const elseif = getAndRemoveAttr(el, 'v-else-if')
        if (elseif) {
            el.elseif = elseif
        }
    }
}
function processKey(el) {
    const exp = getBindingAttr(el, 'key')
    if (exp) {
        el.key = exp
    }
}
function processRef(el) {
    // 提取并删除ref 挂载到el上面，同时判断是否在v-for内部
    const ref = getBindingAttr(el, 'ref')
    if (ref) {
        el.ref = ref
        // 这里为了ref在v-for内部时能正确处理，以确保引用的唯一性和正确性
        el.refInFor = checkInFor(el)
    }
}
function checkInFor(el) {
    // 向上遍历，检查el中有没有parent，有没有for标记，这个for标记就是在有v-for指令时会存在的，一直向上找直到没有parent
    let parent = el
    while (parent) {
        if (parent.for !== undefined) {
            return true
        }
        parent = parent.parent
    }
    return false
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

function getSlotName(binding) {
    // 把v-slot: 或#替换为空，这样就只剩下name了，接着判断是否有name
    let name = binding.name.replace(slotRE, '')
    if (!name) {
        if (binding.name[0] !== '#') {
            name = 'default'
        }
    }
    // 判断是否是动态值
    return dynamicArgRE.test(name)
        ? { name: name.slice(1, -1), dynamic: true }
        : { name: `"${name}"`, dynamic: false }
}
function processSlotContent(el) {
    let slotScope
    if (el.tag === 'template') {
        // 先处理作用域插槽的两种写法，只写scope的比较少见  获取到slot-scope的值并绑定在slotScope中
        slotScope = getAndRemoveAttr(el, 'scope')
        el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope')
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
        // el的标签不是template且存在slot - scope属性，则将其赋值给slotScope变量
        el.slotScope = slotScope
    }
    // 处理具名插槽的名称   slot="xxx"
    const slotTarget = getBindingAttr(el, 'slot')
    if (slotTarget) {
        // 这里默认不给任何值时对应的是default
        el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget
        // 这里判断slot的值是不是动态的 如果解析的emelent里面属性字典里面有:slot或v-bind:slot则做标记
        el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot'])
        // 如果不是template且没有slotscope  则直接给el的属性添加{name: 'slot', value: slotTarget}
        if (el.tag !== 'template' && !el.slotScope) {
            addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'))
        }
    }
    // 处理v-slot
    if (process.env.NEW_SLOT_SYNTAX) {
        if (el.tag === 'template') {
            //用正则去匹配v-slot:header  #footer  v-slot这三种写法
            const slotBinding = getAndRemoveAttrByRegex(el, slotRE)
            if (slotBinding) {
                const { name, dynamic } = getSlotName(slotBinding)
                el.slotTarget = name
                el.slotTargetDynamic = dynamic
                el.slotScope = slotBinding.value || emptySlotScopeToken
            }
        } else {
            // v-slot只能用在template或者组件上 这里处理在组件上的情况
            const slotBinding = getAndRemoveAttrByRegex(el, slotRE)
            if (slotBinding) {
                // 创建一个slotContainer元素，用于存储插槽的相关信息，保存在el上面
                const slots = el.scopedSlots || (el.scopedSlots = {})
                const { name, dynamic } = getSlotName(slotBinding)
                // 创建一个名为slotContainer的AST元素，类型为template，并将其存储在slots对象中的对应名称的属性上
                const slotContainer = slots[name] = createASTElement('template', [], el)
                slotContainer.slotTarget = name
                slotContainer.slotTargetDynamic = dynamic
                slotContainer.children = el.children.filter((c) => {
                    if (!c.slotScope) {
                        // 找出那些没有slotScope属性的孩子节点，然后将它们的父节点指向slotContainer，并返回true，以便将它们作为slotContainer的孩子节点。
                        c.parent = slotContainer
                        return true
                    }
                })
                slotContainer.slotScope = slotBinding.value || emptySlotScopeToken
                el.children = [] // 清空el.children数组，因为插槽内容将会从scopedSlots中取得。
                el.plain = false // 表示el不再是一个简单的静态节点，需要生成相应的渲染数据
            }
        }
    }

}
function processSlotOutlet(el) {
    if (el.tag === 'slot') {
        el.slotName = getBindingAttr(el, 'name')
    }
}
function processComponent(el) {
    let binding
    if ((binding = getBindingAttr(el, 'is'))) {
        el.component = binding
    }
    if (getAndRemoveAttr(el, 'inline-template') != null) {
        el.inlineTemplate = true
    }
}
// 这里开始处理html解析后标签上的属性
function processAttrs(el) {
    const list = el.attrsList
    let i, l, name, rawName, value, modifiers, syncGen, isDynamic
    for (i = 0, l = list.length; i < l; i++) {
        name = rawName = list[i].name
        value = list[i].value
        // dirRE来判断简写指令还是非简写，简写的情况下：
        // ^v-：以v-开头的指令。
        // 示例：v-if、v-for、v-bind等。
        // ^@：以@符号开头的指令。
        // 示例：@click、@input、@keyup.enter等。
        // ^:：以:符号开头的指令。
        // 示例：:value、:class、:style等。
        // ^\.：以.符号开头的指令。
        // 示例：.sync、.once、.native等。
        // ^#：以#符号开头的指令。
        // 示例：#ref、#slot、#key等。

        // 判断有这些指令，则代表有响应式数据
        if (dirRE.test(name)) {
            el.hasBindings = true //标记有绑定
            modifiers = parseModifiers(name.replace(dirRE, ''))  // 解析指令并把修饰符保留在modifiers中
        }
        console.log(list[i].name, el, '------list[i].name-----');
    }
}
function parseModifiers(name) {
    // /\.[^.\]]+(?=[^\]]*$)/g  匹配.字符+除.和]外的多个字符+正向肯定预查，用于限制修饰符不能包含]字符；这样确保匹配到的格式是正确的
    // 例如@click.stop
    const match = name.match(modifierRE)
    if (match) {
        const ret = {}
        match.forEach(m => { ret[m.slice(1)] = true })
        return ret
    }
}