import { hasOwn } from 'shared/util'
import config from '../config'
const strats = config.optionMergeStrategies
const defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
        ? parentVal
        : childVal
}
function mergeData(to, from) {
    if (!from) return to
    let key, toVal, fromVal
    const keys = Object.keys(from)
    for (let i = 0; i < keys.length; i++) {
        key = keys[i]
        fromVal = from[key]
        toVal = to[key]
        // if (!hasOwn(to,key)) {

        // }
    }
}
strats.data = function (parentVal,
    childVal,
    vm) {

    if (!vm) {

    } else if (parentVal || childVal) {
        return function mergedInstanceDataFn() {
            const instanceData = typeof childVal === 'function'
                ? childVal.call(vm)
                : childVal
            const defaultData = typeof parentVal === 'function'
                ? parentVal.call(vm)
                : undefined
            if (instanceData) {
                return mergeData(instanceData, defaultData)
            } else {
                return defaultData
            }
        }
    }
}
export function mergeOptions(parent,
    child,
    vm) {
    const options = {}
    let key
    for (key in parent) {
        mergeField(key)
    }
    for (key in child) {
        if (!hasOwn(parent, key)) {
            mergeField(key)
        }
    }
    function mergeField(key) {
        /*strats里面存了options中每一个属性（el、props、watch等等）的合并方法，先取出*/
        const strat = strats[key] || defaultStrat
        /*根据合并方法来合并两个option*/
        options[key] = strat(parent[key], child[key], vm, key)
    }
    return options
}