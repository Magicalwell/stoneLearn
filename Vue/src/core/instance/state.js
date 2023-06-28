import { isPlainObject, validateProp, isServerRendering, nativeWatch, isReserved } from '../util/index'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { set, del, toggleObserving, defineReactive, observe } from '../observer/index'
import { hasOwn, noop } from '../../shared/util'
const computedWatcherOptions = { lazy: true }
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function proxy(target, sourceKey, key) {
  // 把key转换成描述器代理到target上，注意这里sourcekey为字符串，只能有一层例如a:{b:1,c:{d:2}},key只能代理bc不能d。再深的层级要在外部递归。
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
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
  console.log(vm,'------------datadata-');
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
      watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions)  //一个组件会有一套watcher，也就是那3中：渲染，计算，普通watcher,主要做了：1.让dep添加自己，自己也添加dep，2.数据更新
    }
    if (!(key in vm)) {
      defineComputed(vm, key, userDef) //处理计算属性，详细见下方
    }
  }

}
function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this)
  }
}
function createComputedGetter(key) {
  return function computedGetter() {
    // 先获取计算属性的watcher  这个在初始化阶段就会有了  vue中有三个watcher  渲染阶段的render watcher  计算属性的watcher和普通的，这里this是组件实例
    //  initComputed const watchers = vm._computedWatchers = Object.create(null)
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // 这个dirty是watcher身上的属性,为true才会重新计算，这就是缓存的关键
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 用于收集访问到的属性的dep
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}
function initWatch(vm, watch) {
  for (const key in watch) {
    // 遍历用户定义的watch
    const handler = watch[key]
    if (Array.isArray(handler)) {
      // 这里是传入了数组，数组中每一项都是一个函数，这里进行处理挨个创建watcher
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
// 计算属性因为存在缓存，所以要做处理
export function defineComputed(target, key, userDef) {
  // 判断运行在什么平台上，服务端的话就不给缓存了，直接调用用错误处理工厂函数包装之后的用户定义的userDef
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache ? createComputedGetter(key) : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    // 用get和set方式定义的computed  先判断是否给了get然后走到跟上面一样的判断逻辑中
    sharedPropertyDefinition.get = userDef.get ? shouldCache && userDef.cache !== false ? createComputedGetter(key) : createGetterInvoker(userDef.get) : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
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
  // 下面依次进行props methods data computed watch的初始化
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