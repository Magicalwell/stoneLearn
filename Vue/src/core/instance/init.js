import { mergeOptions } from '../util/index'
import { initLifecycle, callHook } from './lifecycle'
let uid = 0
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        // 这一步标记自身是vue实例，避免后续监听整个vue实例
        vm._isVue = true
        vm._uid = uid++
        if (options && options._isComponent) {

        } else {
            // 这里选项合并的对象是 initglobalApi中创建的那个options，里面有components filter directive 和new vue时传入的选项
            // 但刚刚initglobalApi的时候，提到了一个vue.extend的方法，这也是创建vue实例的方法之一，这里合并的时候就需要考虑到这种方式
            vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm)
        }
        if (process.env.NODE_ENV !== 'production') {
            // initProxy(vm)
        } else {
            vm._renderProxy = vm
        }
        vm._self = vm
        initLifecycle(vm)
    }
}
export function resolveConstructorOptions(Ctor) {
    // 这个函数的作用就是处理两种情况产生的vue实例，一种是new Vue出来的，一种是extend出来的
    // 在上面merge的时候传入的参数是vm.constructor，constructor指向的是当前对象的构造函数 vm._proto_指向的是当前对象的原型，
    // prototype是构造函数的属性，指向它的原型
    let options = Ctor.options
    // 不管是new出来 还是extend出来，都会有options，区别是new出来是自己的，extend出来是已经合并过的
    // 这里存在super的情况，并不是es6 class的那个super，而是在调用vue.extend的时候，会给实例新增一个属性，如下：
    // Vue.extend = function (extendOptions: Object): Function {
    //     ...
    //     Sub['super'] = Super  指向父类的构造函数
    //     ...
    //   }
    if (Ctor.super) {

    }
    return options
}