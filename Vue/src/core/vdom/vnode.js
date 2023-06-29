export default class VNode { }
export const createEmptyVNode = (text = '') => {
    const node = new VNode()
    node.text = text
    node.isComment = true
    return node
}