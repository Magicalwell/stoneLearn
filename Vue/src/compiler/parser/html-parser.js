import { makeMap } from 'shared/util'
import { unicodeRegExp } from 'core/util/lang'
export const isPlainTextElement = makeMap('script,style,textarea', true)

const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const comment = /^<!\--/
const conditionalComment = /^<!\[/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const doctype = /^<!DOCTYPE [^>]+>/i
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/

const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g

const decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&#39;': "'"
}

const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

function decodeAttr(value, shouldDecodeNewlines) {
    const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
    return value.replace(re, match => decodingMap[match])
}

export function parseHTML(html, options) {
    const stack = []
    const expectHTML = options.expectHTML
    const isUnaryTag = options.isUnaryTag || (() => false)
    let index = 0
    let last, lastTag
    while (html) {
        last = html
        // 针对一些特殊的元素标签做处理
        // lastTag 是一个变量，用于存储上一个解析的开始标签名。这个变量在解析过程中会被更新为当前解析的开始标签名
        // 它主要用来判断当前解析的光标是不是在一个标签的开始标签内部
        if (!lastTag || !isPlainTextElement(lastTag)) {
            let textEnd = html.indexOf('<') // 判断html是不是由<开始，这里可能还有注释
            if (textEnd === 0) {
                if (comment.test(html)) {
                    // 这里判断开头是<--的注释的情况下，找到注释的结尾
                    const commentEnd = html.indexOf('-->')
                    if (commentEnd >= 0) {
                        if (options.shouldKeepComment) {
                            // 是否保留注释
                            options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3)
                        }
                        advance(commentEnd + 3)
                        continue
                    }
                }
                // 条件注释，实际中没遇到过
                if (conditionalComment.test(html)) {
                    const conditionalEnd = html.indexOf(']>')

                    if (conditionalEnd >= 0) {
                        advance(conditionalEnd + 2)
                        continue
                    }
                }
                // 程序运行到这里  下一个html就不会是注释了  但是还有其他特殊的字段需要判断
                // doctype
                const doctypeMatch = html.match(doctype)
                if (doctypeMatch) {
                    advance(doctypeMatch[0].length)
                    continue
                }
                // 先检测结束标签 这里是为了处理嵌套结构下标签闭合的问题 如果先检测开始标签，那么可能存在无法判断结束标签是属于哪个开始标签
                // 这里检测标签的原理是匹配合法的标签
                const endTagMatch = html.match(endTag)
                if (endTagMatch) {
                    console.log(endTagMatch, 'endTagendTagendTag');
                    const curIndex = index
                    advance(endTagMatch[0].length)
                    parseEndTag(endTagMatch[1], curIndex, index)
                    continue
                }

                const startTagMatch = parseStartTag()
                if (startTagMatch) {
                    // 对匹配的开始标签进行处理，因为属性和操作符都在开始标签的括号中，所以这里要比结束标签多一个处理解析的过程
                    handleStartTag(startTagMatch)
                    if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
                        advance(1)
                    }
                    continue
                }
            }
            let text, rest, next
            if (textEnd >= 0) {
                // 处理文本
                rest = html.slice(textEnd)
                while (
                    !endTag.test(rest) &&
                    !startTagOpen.test(rest) &&
                    !comment.test(rest) &&
                    !conditionalComment.test(rest)
                ) {
                    next = rest.indexOf('<', 1)
                    if (next < 0) break
                    textEnd += next
                    rest = html.slice(textEnd)
                }
                text = html.substring(0, textEnd)
            }
            if (textEnd < 0) {
                text = html
            }
            if (text) {
                advance(text.length)
            }

            if (options.chars && text) {
                options.chars(text, index - text.length, index)
            }
        } else {
            let endTagLength = 0
            const stackedTag = lastTag.toLowerCase()
            const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
            // 用于处理html里面写了script的情况
            const rest = html.replace(reStackedTag, function (all, text, endTag) {
                endTagLength = endTag.length
                if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
                    text = text
                        .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
                        .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
                }
                if (shouldIgnoreFirstNewline(stackedTag, text)) {
                    text = text.slice(1)
                }
                if (options.chars) {
                    options.chars(text)
                }
                return ''
            })
            index += html.length - rest.length
            html = rest
            parseEndTag(stackedTag, index - endTagLength, index)
        }
        if (html === last) {
            options.chars && options.chars(html)
            break
        }
    }
    parseEndTag()
    function parseStartTag() {
        const start = html.match(startTagOpen)
        if (start) {
            const match = {
                tagName: start[1],
                attrs: [],
                start: index
            }
            advance(start[0].length)
            let end, attr
            // 这里匹配到开始标签后  advance进入到标签内  先判断是不是单个标签也就是 <test /> 这种写法，然后匹配属性 v-xxx等
            while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
                attr.start = index // 记录属性的起始点
                advance(attr[0].length)  //计算属性的长度并更新index
                attr.end = index  // 记录属性的结束点
                match.attrs.push(attr)
            }
            if (end) {
                match.unarySlash = end[1]
                advance(end[0].length)
                match.end = index
                return match
            }
        }
    }
    function handleStartTag(match) {
        const tagName = match.tagName
        const unarySlash = match.unarySlash
        if (expectHTML) {
            console.log('11111111');
        }
        const unary = isUnaryTag(tagName) || !!unarySlash  //自闭合标签的判断
        const l = match.attrs.length
        const attrs = new Array(l)
        // match中的数据类似这样：[' v-model="test"', 'v-model', '=', 'test', undefined, undefined, index: 0]
        for (let i = 0; i < l; i++) {
            const args = match.attrs[i]
            // args的第二项是属性标签名 第四项是值
            const value = args[3] || args[4] || args[5] || ''
            const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
                ? options.shouldDecodeNewlinesForHref
                : options.shouldDecodeNewlines
            attrs[i] = {
                name: args[1],
                value: decodeAttr(value, shouldDecodeNewlines)
            }
        }
        console.log(attrs,options, 'attrsattrs');
        if (!unary) {
            stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
            lastTag = tagName  // 更新lastTag
        }

        if (options.start) {
            options.start(tagName, attrs, unary, match.start, match.end)
        }
    }
    // advance直接截取剩下的html
    function advance(n) {
        index += n
        html = html.substring(n)
    }
    function parseEndTag(tagName, start, end) {
        let pos, lowerCasedTagName
        if (start == null) start = index
        if (end == null) end = index

        if (tagName) {
            lowerCasedTagName = tagName.toLowerCase()
            for (pos = stack.length - 1; pos >= 0; pos--) {
                // 这里遍历之前缓存解析的开始标签，注意这里是从第一个结束标签倒着遍历的
                if (stack[pos].lowerCasedTag === lowerCasedTagName) {
                    break
                }
            }
        } else {
            pos = 0
        }

        if (pos >= 0) {
            for (let i = stack.length - 1; i >= pos; i--) {
                if (options.end) {
                    options.end(stack[i].tag, start, end)
                }
            }
            stack.length = pos  // 确保堆栈数组只包含在当前处理位置之前的标签元素
            lastTag = pos && stack[pos - 1].tag // pos为零，不会走到后面的逻辑
            // 如果pos不为0则表示上一个标签存在取出stack数组中索引为pos-1的元素并获取其标签名（tag属性）将其赋值给lastTag变量。如果pos为0，表示没有上一个标签，则将lastTag设为''（空字符串）。
        } else if (lowerCasedTagName === 'br') {
            // 这里单独判断br和p的原因是，这俩标签都可以写成</br>、</p>，都能换行，有些浏览器会把这俩解析，
            //  </br> 标签被正常解析为 <br> 标签，而</p>标签被正常解析为 <p></p> ，为了一致性这里单独判断
            if (options.start) {
                options.start(tagName, [], true, start, end)
            }
        } else if (lowerCasedTagName === 'p') {
            if (options.start) {
                options.start(tagName, [], false, start, end)
            }
            if (options.end) {
                options.end(tagName, start, end)
            }
        }
    }
}
