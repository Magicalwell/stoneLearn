import { makeMap } from 'shared/util'
import { unicodeRegExp } from 'core/util/lang'
export const isPlainTextElement = makeMap('script,style,textarea', true)

const comment = /^<!\--/
const conditionalComment = /^<!\[/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const doctype = /^<!DOCTYPE [^>]+>/i
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const startTagOpen = new RegExp(`^<${qnameCapture}`)


const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

export function parseHTML(html, options) {
    let index = 0
    let last, lastTag
    while (html) {
        last = html
        // 针对一些特殊的元素标签做处理
        if (!lastTag || !isPlainTextElement(lastTag)) {
            let textEnd = html.indexOf('<') // 判断html是不是由<开始，这里可能还有注释
            if (textEnd === 0) {
                if (comment.test(html)) {
                    // 这里判断开头是<--的注释的情况下，找到注释的结尾
                    const commentEnd = html.indexOf('-->')
                    if (commentEnd >= 0) {
                        if (options.shouldKeepComment) {
                            // 是否保留注释
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
                // 先检测结束标签
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
                    // < in plain text, be forgiving and treat it as text
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
        } else {

        }
    }
    function parseStartTag() {
        const start = html.match(startTagOpen)
        if (start) {
            // const match = 
            console.log(start, '=========');
        }
        return
    }
    // advance直接截取剩下的html
    function advance(n) {
        index += n
        html = html.substring(n)
    }
}
