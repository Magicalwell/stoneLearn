import Dep from './dep'
import VNode from '../vdom/vnode'
import { isArray, isValidArrayIndex, hasOwn, isObject, isPlainObject, hasProto, def, isServerRendering } from '../util/index'
import { arrayMethods } from './array'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
export let shouldObserve = true  // 用于开启或关闭响应式数据的开关

export function toggleObserving(value) {
    shouldObserve = value
}
export class Observer {
    constructor(value) {
        this.value = value
        this.dep = new Dep()
        this.vmCount = 0
        def(value, '__ob__', this) //把自己挂载value上的__ob__中去
        if (Array.isArray(value)) {
            // 这里处理数组，数组的响应式不是对每一项进行响应式处理，而是改写数组的一些修改方法，例如push等，在操作结束后手动去通知更新
            // 下面进行的判断是为了兼容某些环境下数组对象不继承object对象，这里有点疑问具体是哪些情况？有一种情况是通过object.create(null)创建的
            // 但是这里又是写死的判断，感觉这里可以近似看做是true
            if (hasProto) {
                protoAugment(value, arrayMethods)
            } else {
                copyAugment(value, arrayMethods, arrayKeys)
            }
            this.observeArray(value)
        } else {
            // 对象类型直接walk遍历去做响应式代理
            this.walk(value)
        }
    }
    walk(obj) {
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i])
        }
    }
    observeArray(items) {
        for (let i = 0, l = items.length; i < l; i++) {
            observe(items[i])
        }
    }
}

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
    // 逻辑走到这里就是正常的给一个对象中新增一个key，然后通知依赖了这个对象的watcher更新
    defineReactive(ob.value, key, val)
    ob.dep.notify()
    return val
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
        ob = new Observer(value) // 创建观察者
    }
    if (asRootData && ob) {
        // 用来计数，表示ob被多少vue实例引用
        ob.vmCount++
    }
    return ob
}
export function defineReactive(obj, key, val, customSetter, shallow) {
    const dep = new Dep()  //dep可以理解为依赖管理器，每个属性都有，它保存依赖自身的watch，负责在更新时通知watch更新数据。
    // 判断key是不是object内置的，并且判断是否可以设置
    const property = Object.getOwnPropertyDescriptor(obj, key)
    // property返回的是属性的描述器，由value,writable,get,set,configurable,enumerable组成
    if (property && property.configurable === false) {
        return
    }
    const getter = property && property.get
    const setter = property && property.set
    // 判断只有setter且只传入了两个参数 obj和key的情况，手动给val给值
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key]
    }
    let childOb = !shallow && observe(val) // 是否递归将子对象的属性也转为get set
    // 下面就是耳熟能详的object.definedproperty
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            const value = getter ? getter.call(obj) : val
            // 如果目前有watcher在全局的target上，则收集依赖
            if (Dep.target) {
                dep.depend()
                if (childOb) {
                    // 有子对象，递归调用depend
                    childOb.dep.depend()
                    if (Array.isArray(value)) {
                        dependArray(value)
                    }
                }
            }
            return value
        },
        set: function reactiveSetter(newVal) {
            const value = getter ? getter.call(obj) : val
            // 下面的判断用于判断新值是否与旧值相等  第二个或的判断 自身与自身比较主要是为了判断NaN
            if (newVal === value || (newVal !== newVal && value !== value)) {
                return
            }
            // 有getter没setter直接返回
            if (getter && !setter) return
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            childOb = !shallow && observe(newVal)
            dep.notify()  //通知更新
        }
    })

}
function dependArray(value) {
    for (let e, i = 0, l = value.length; i < l; i++) {
        e = value[i]
        e && e.__ob__ && e.__ob__.dep.depend()
        if (Array.isArray(e)) {
            dependArray(e)
        }
    }
}
function protoAugment(target, src) {
    target.__proto__ = src
}
function copyAugment(target, src, keys) {
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        def(target, key, src[key])
    }
}