const hasOwnProperty = Object.prototype.hasOwnProperty
export const isArray = Array.isArray
export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key)
}
export function isValidArrayIndex(val) {
    const n = parseFloat(String(val))
    return n >= 0 && Math.floor(n) === n && isFinite(val)
}
export function extend(to, _from) {
    for (const key in _from) {
        to[key] = _from[key]
    }
    return to
}
export function isDef(v) {
    return v !== undefined && v !== null
}