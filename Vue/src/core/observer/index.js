import { isArray, isValidArrayIndex, hasOwn } from '../util/index'
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
export function defineReactive() { }