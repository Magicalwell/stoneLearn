import { hasOwn, camelize, isPlainObject, extend } from 'shared/util'
import config from '../config'
import { hasSymbol } from './env'
import { set } from '../observer/index'
const strats = config.optionMergeStrategies
const defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
        ? parentVal
        : childVal
}
function normalizeProps(options, vm) {
    const props = options.props
    if (!props) return //没props跳过后续逻辑
    const res = {}
    let i, val, name
    if (Array.isArray(props)) {
        // props为数组形式props:[list,data] 最终还是转为对象形式，只不过type:null
        i = props.length
        // i--作为条件，当递减到0时转为布尔值为false
        while (i--) {
            val = props[i]
            if (typeof val === 'string') {
                // 英文全转换小写
                name = camelize(val)
                res[name] = { type: null }
            }
        }
    } else if (isPlainObject(props)) {
        // props中为对象的情况下，判断单个props的值是否是对象，是就直接用，不是的情况可能是这样props:{list:array}
        for (const key in props) {
            val = props[key]
            name = camelize(key)
            res[name] = isPlainObject(val) ? val : { type: val }
        }
    }
    options.props = res // 重新赋值
}
function normalizeInject(options, vm) {
    const inject = options.inject
    if (!inject) return
    const normalied = options.inject = {}
    if (Array.isArray(inject)) {
        for (let i = 0; i < inject.length; i++) {
            normalied[inject[i]] = { from: inject[i] }
        }
    } else if (isPlainObject(inject)) {
        for (const key in inject) {
            const val = inject[key]
            normalied[key] = isPlainObject(val) ? extend({ from: key }, val) : { from: val }
        }
    }
}
function normalizeDirectives(options) {
    // 处理指令，如果存在则把指令的方法保存在bind和update上面
    const dirs = options.directives
    if (dirs) {
        for (const key in dirs) {
            const def = dirs[key]
            if (typeof def === 'function') {
                dirs[key] = { bind: def, update: def }
            }
        }
    }
}
function mergeData(to, from) {
    if (!from) return to
    let key, toVal, fromVal
    // const keys = Object.keys(from)
    const keys = hasSymbol ? Reflect.ownKeys(from) : Object.keys(from)
    
    for (let i = 0; i < keys.length; i++) {
        key = keys[i]
        if (key === '__ob__') continue
        toVal = to[key]
        fromVal = from[key]
        if (!hasOwn(to, key)) {
            set(to, key, fromVal)
        } else if (toVal !== fromVal && isPlainObject(toVal) && isPlainObject(fromVal)) {
            mergeData(toVal, fromVal)
        }
    }
    return to
}
export function mergeDataOrFn(parentVal, childVal, vm) {
    if (!vm) {

    } else {
        return function mergedInstanceDataFn() {
            const instanceData = typeof childVal === 'function'
                ? childVal.call(vm, vm)
                : childVal
            const defaultData = typeof parentVal === 'function'
                ? parentVal.call(vm, vm)
                : parentVal
            if (instanceData) {
                return mergeData(instanceData, defaultData)
            } else {
                return defaultData
            }
        }
    }
}
strats.data = function (parentVal,
    childVal,
    vm) {

    // if (!vm) {
    //     return parentVal
    // } else if (parentVal || childVal) {
    //     return function mergedInstanceDataFn() {
    //         const instanceData = typeof childVal === 'function'
    //             ? childVal.call(vm)
    //             : childVal
    //         const defaultData = typeof parentVal === 'function'
    //             ? parentVal.call(vm)
    //             : undefined
    //         if (instanceData) {
    //             return mergeData(instanceData, defaultData)
    //         } else {
    //             return defaultData
    //         }
    //     }
    // }
    if (!vm) {
        if (childVal && typeof childVal !== 'function') {
            return parentVal
        }
        return mergeDataOrFn(parentVal, childVal)
    }
    return mergeDataOrFn(parentVal, childVal, vm)
}
export function mergeOptions(parent,
    child,
    vm) {
    if (typeof child === 'function') {
        child = child.options
    }
    // 格式化并校验子组件的props是不是合法
    normalizeProps(child, vm)
    normalizeInject(child, vm)
    normalizeDirectives(child)
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
        // strats里面预设了一些属性的合并策略，根据key值来确定用哪个方法
        const strat = strats[key] || defaultStrat
        /*根据合并方法来合并两个option*/
        options[key] = strat(parent[key], child[key], vm, key)
    }
    return options
}