import { isPlainObject, validateProp, isServerRendering } from '../util/index'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { set, del, toggleObserving, defineReactive, observe } from '../observer/index'
import { hasOwn, noop } from '../../shared/util'
const computedWatcherOptions = { lazy: true }
function createWatcher(vm, expOrFn, handler, options) {
  // 判断传入的handler也就是回调函数是不是对象，对应watch的一种写法：
  // message: {
  //   handler(){ }
  // }
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler //取到对象中的handler作为回调
  }
  if (typeof handler === 'string') {
    handler = vm[handler] //字符串直接取vm实例身上的
  }
  // 到这里的时候handler只能是函数形式的  vm.$watch其实就是再次调用Vue.prototype.$watch，只不过经过处理后，不会再走进isPlainObject(cb)判断中了
  return vm.$watch(expOrFn, handler, options)
}
function initProps(vm, propsOptions) {
  // 这里的propsData是由extend出来或者选项中给了才会有的，通常情况下为空，只是由子组件渲染逻辑出来的才有存,放父组件传入子组件的props,具体是在父组件创建vnode时，走到子组件的占位符这里然后就是子组件的创建逻辑，createComponent中  const propsData = extractPropsFromVNodeData(data, Ctor, tag)提取了父组件传递过来的props，然后创建vnode时当做属性传递进去，详见：https://juejin.cn/post/6844904160597377031
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {} // 用于保存后续添加的prop，这个属性是所有的prop，可以在vue中取到
  // 这里缓存key并且挂载到options上面，并且在这里保留一个指针keys方便调用
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  if (!isRoot) {
    // 如果不是根组件，那么取消对响应式数据的观测，这样是因为子组件只需要观测父组件传递下来的数据和内部的数据，等到后续操作完成后会重新开启响应式数据的观测
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key) // keys是options._propKeys的引用，所以相当于把key压入options
    const value = validateProp(key, propsOptions, propsData, vm)
    defineReactive(props, key, value)
    if (!(key in vm)) {
      // 如果vm上面没有，则把_prop代理到vm上面，也这是为什么在代码中可以直接this.访问到prop
      proxy(vm, '_props', key)
    }
  }
  toggleObserving(true)
}
function initMethods(vm, methods) {
  // methods的处理逻辑很简单，通过bind改变this即可，然后挂载到vm上面
  for (const key in methods) {
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}
function initData(vm) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function' ? getData(data, vm) : data || {}
  if (!isPlainObject(data)) {
    data = {}
  }
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    // 这里分别判断data中的key是否和prop methods中有重复
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        noop()
      }
    }
    if (props && hasOwn(props, key)) {
      noop()
    } else if (!isReserved(key)) {
      proxy(vm, '_data', key)
    }
  }
  observe(data, true) // asRootData
}
function initComputed(vm, computed) {
  // 在vm上创建一个watcher数组用于保存计算属性的watcher
  const watchers = vm._computedWatchers = Object.create(null)
  const isSSR = isServerRendering()
  for (const key in computed) {
    const userDef = computed[key]
    //获取用户定义的计算属性，有两种方式，一种是a (return) 一种是以get和set方式写的是个对象
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (!isSSR) {
      watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions)
    }
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    }
  }

}
export function getData(data, vm) {
  pushTarget() //将一个无效的undefined加入调用栈的顶部，以在操作响应式数据的时候不添加不必要的依赖
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}
export function stateMixin(Vue) {
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)
  // vue构造函数上面已经有set del方法 initglobalapi方法挂载的，给原型上面也挂载上
  Vue.prototype.$set = set
  Vue.prototype.$delete = del
  // vue中有三个watch 一个是渲染watch 计算属性的watch  普通的watch，下面这个是普通的watch，就和vue选项中的watch一样
  Vue.prototype.$watch = function (expOrFn, cb, options) {
    // expOrFn, cb, options 依次为侦听的属性，回调函数，配置项deep等
    const vm = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true // 标记是哪种watch因为三种watch都是通过new Watch创建的
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`
      pushTarget() //将一个无效的undefined加入调用栈的顶部，以在操作响应式数据的时候不添加不必要的依赖
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info) // 还是通过错误处理包装后调用
      popTarget()
    }
  }
}

export function initState(vm) {
  vm._watchers = []
  const opts = vm.$options
  // 下面依次进行props methods data computed watch的初始化，后面的不能访问到前面的
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}