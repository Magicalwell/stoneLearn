import { isArray, isValidArrayIndex, hasOwn, isObject, isPlainObject } from '../util/index'

export let shouldObserve = true  // 用于开启或关闭响应式数据的开关

export function toggleObserving(value) {
    shouldObserve = value
}
export class Observer { }

export function set(target, key, val) {
    const ob = target.__ob__
    // 这里处理的是$set([],key,val)的情况，也就是直接操作数组的下标，这时候手动用splice进行更新
    if (isArray(target) && isValidArrayIndex(key)) {
        // 处理长度变长的情况 直接修改length  key比length短的情况下不影响，splice做替换
        target.length = Math.max(target.length, key)
        target.splice(key, 1, val)
        // 这里直接返回，因为数组不做响应式处理，采用重写array的七个方法实现，而上面的splice已经是被重写过的
        return val
    }
    if (hasOwn(target, key)) {
        // 如果是对象，且在目标target上面已经存在，直接重新赋值然后返回，这里会触发target【key】的set方法，进入响应式
        target[key] = val
        return val
    }
    // 这里考虑到vue实例被保存在数据中的情况，例如componentsis可以直接传入vue实例渲染出来，这种情况就不能监听，因为会重复
    if (target._isVue || (ob && ob.vmCount)) {
        return val
    }
    // 处理非响应式数据
    if (!ob) {
        target[key] = val
        return val
    }
    defineReactive()
}
export function del(target, key) {
    // 先判断目标是不是数组，key是不是数字
    if (isArray(target) && typeof key === 'number') {
        target.splice(key, 1) // 调用被重写的数组方法
        return
    }
    const ob = target.__ob__
    if (target._isVue || (ob && ob.vmCount)) {
        return
    }
    // 没有key这个对象
    if (!hasOwn(target, key)) {
        return
    }
    delete target[key]
    if (!ob) {
        // 对象没有观察者，不是响应式，则直接返回啥也不做
        return
    }
    ob.dep.notify()
}
export function observe(value, asRootData) {
    if (!isObject(value) || value instanceof VNode) {
        // 不是对象或vnode节点不观测，这里observe一般传入data
        return
    }
    let ob
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        // 如果已经被观测过，则直接拿来返回
        ob = value.__ob__
    } else if (shouldObserve && !isServerRendering() && (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue) {
        // shouldObserve：这个变量控制着是否需要将变量转换为响应式数据。如果它的值为 false，则表示不需要将变量转换为响应式数据。当 Vue.js 初始化时，会根据用户传递的选项参数来决定 shouldObserve 的值。

        // !isServerRendering()：这个方法用来判断当前代码是否在服务器端渲染的环境中执行，如果是，则不能将变量转换为响应式数据。

        // (Array.isArray(value) || isPlainObject(value))：这个条件判断了变量的类型是否为数组或者纯对象，只有数组和纯对象才能被转换为响应式数据。

        // Object.isExtensible(value)：这个方法用来检查对象是否可以添加新的属性。只有能够添加新属性的对象才能被转换为响应式数据。

        // !value._isVue：这个条件判断了变量是否已经是 Vue 实例，如果是，则不需要再将它转换为响应式数据。
        ob = new Observer(value)
    }
    if (asRootData && ob) {
        // 用来计数，表示ob被多少vue实例引用
        ob.vmCount++
    }
    return ob
}
export function defineReactive() { }