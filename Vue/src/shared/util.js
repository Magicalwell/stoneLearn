const hasOwnProperty = Object.prototype.hasOwnProperty
export const isArray = Array.isArray
export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key)
}
// 判断传过来的数组下标是不是正确合理的值
export function isValidArrayIndex(val) {
    const n = parseFloat(String(val))
    return n >= 0 && Math.floor(n) === n && isFinite(val)
}
// 相当于一个浅拷贝
export function extend(to, _from) {
    for (const key in _from) {
        to[key] = _from[key]
    }
    return to
}
// 判断是否为空值
export function isDef(v) {
    return v !== undefined && v !== null
}
// 把类数组从指定的开头转为数组，这种写法兼容性很好
export function toArray(list, start) {
    start = start || 0
    let i = list.length - start
    const ret = new Array(i)
    while (i--) {
        ret[i] = list[i + start]
    }
    return ret
}