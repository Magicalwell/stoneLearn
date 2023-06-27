import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 几种对数组进行修改的方法，需要进行拓展，主动进行响应式的通知
const methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]
// 这里不用es6箭头函数是因为this的指向问题,用箭头函数则this会指到window，而这里需要this指向当前的method
// 为什么这里用function时，内部this为foreach的当前项？因为foreach内部实现其实就是遍历然后调用传入的函数，method传入的是this[i]，相当于是当前的项
methodsToPatch.forEach(function (method) {
    const original = arrayProto[method] //获取到原生的方法
    def(arrayMethods, method, function mutator(...args) {
        const result = original.apply(this, args) //先保有原生的方法逻辑，并调用一遍，在最后响应式逻辑执行完后返回。等同于切片重写
        const ob = this.__ob__
        let inserted
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args
                break;
            case 'splice':
                inserted = args.slice(2)
                break;
        }
        if (inserted) ob.observeArray(inserted)
        ob.dep.notify()
        return result
    })
})