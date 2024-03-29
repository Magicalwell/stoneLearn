import { mergeOptions, extend } from '../util/index'
import { initLifecycle, callHook } from './lifecycle'
import { initEvents } from './events'
import { initRender } from './render'
import { initState } from './state'
let uid = 0
export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        // 这一步标记自身是vue实例，避免后续监听整个vue实例
        vm._isVue = true
        vm._uid = uid++
        if (options && options._isComponent) {
            initInternalComponent(vm, options)
        } else {
            // 这里选项合并的对象是 initglobalApi中创建的那个options，里面有components filter directive 和new vue时传入的选项
            // 但刚刚initglobalApi的时候，提到了一个vue.extend的方法，这也是创建vue实例的方法之一，这里合并的时候就需要考虑到这种方式
            vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm)
        }
        vm._renderProxy = vm
        vm._self = vm
        initLifecycle(vm) // 初始化一些后续会用到的对象 例如parent,root _watcher等
        initEvents(vm) // 初始化事件系统 v-on 这里就指的是在父组件中引入了子组件 在其上面可以v-on或者@click等方式监听到事件，而子组件在编译的时候解析到标签时，会获取父组件在自己上面注册的事件并保留在vm.$options._parentListeners​​中
        initRender(vm) // 进行插槽的处理，创建组件两种方法的挂载，attrs和listeners的处理
        callHook(vm, 'beforeCreate') //生命周期走到这里 创建了组件实例，进行了一些初始方法的挂载，获取到后续所需要的数据，例如事件，插槽等。
        // initInjections(vm) // 待完善
        initState(vm)
        // initProvide(vm) // resolve provide after data/props
        callHook(vm, 'created')

        if (vm.$options.el) {
            vm.$mount(vm.$options.el)
        }
    }
}
// resolveConstructorOptions用来返回类构造函数上面的最新的options
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
        const superOptions = resolveConstructorOptions(Ctor.super) // 父类可能也有父类，进行递归获得父类的options
        const cacheSuperOptions = Ctor.superOptions
        if (superOptions !== cacheSuperOptions) {
            // 这俩不相等的情况是指父类还有父类  如果相等则说明传入的ctor已经是最高等级的类了，直接不走下方的逻辑，返回opitons即可
            // 在extend后父类的options发生了变化，把新的options更新到子类Sub上面去
            Ctor.superOptions = superOptions  //父类的父类options
            const modifiedOptions = resolveConstructorOptions(Ctor)
            if (modifiedOptions) {
                extend(Ctor.extendOptions, modifiedOptions)
            }
            options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
            if (options.name) {
                // 合并之后的options有name 则在新opitons的组件对象中挂载  方便后续直接通过名称来引用
                options.components[options.name] = Ctor
            }
        }
    }
    return options
}
export function initInternalComponent(vm, options) {
    console.log('in component');
}