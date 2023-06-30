const hasOwnProperty = Object.prototype.hasOwnProperty
export const isArray = Array.isArray
export const emptyObject = Object.freeze({})
const _toString = Object.prototype.toString
const camelizeRE = /-(\w)/g

const hyphenateRE = /\B([A-Z])/g
export function noop(a, b, c) { }
export function isObject(obj) {
    return obj !== null && typeof obj === 'object'
}
export const hyphenate = cached((str) => {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
})

export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key)
}
export function isUndef(v) {
    return v === undefined || v === null
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
// 缓存方法，调用cached实际上调用的是return的一个自执行函数，里面能访问到cache
export function cached(fn) {
    const cache = Object.create(null)
    return (function cachedFn(str) {
        const hit = cache[str]
        return hit || (cache[str] = fn(str))
    })
}

export const camelize = cached((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})
// 借用对象上的tostring方法
export function isPlainObject(obj) {
    return _toString.call(obj) === '[object Object]'
}

export function remove(arr, item) {
    if (arr.length) {
        const index = arr.indexOf(item)
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}

export function makeMap(
    str,
    expectsLowerCase
) {
    const map = Object.create(null)
    const list = str.split(',')
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }
    return expectsLowerCase
        ? val => map[val.toLowerCase()]
        : val => map[val]
}