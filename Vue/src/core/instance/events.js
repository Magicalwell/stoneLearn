import {
  toArray, invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'
let target
function add(event, fn) {
  target.$on(event, fn)
}

function remove(event, fn) {
  target.$off(event, fn)
}
export function initEvents(vm) {
  //vue中的事件有两种，一种是组件事件，一种是原生事件，自定义组件上面定义的事件将走到这里。在父组件编译生成vnode的阶段，运行到自定义的子组件就会调用相应的方法createComponentInstanceForVnode进入到创建组件的逻辑去，这就会走到之前extend方法创建子类的逻辑中，new vnodeComponentOptions.Ctor(options)
  // 也就是const Sub = function VueComponent (options) {
  //   this._init(options)}
  // 再继续走到init初始化方法中的 initInternalComponent(vm, options)因为被标记了_isComponent，这个方法会给$options绑定_parentListeners
  vm._events = Object.create(null) //用于保存事件
  vm._hasHookEvent = false  // 这个hook表示是否通过了@hook的方法把钩子绑定到了组件上
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

export function updateComponentListeners(vm, listeners, oldListeners) {
  target = vm
  //这里的add,remove是之前在实例上挂载的$on $off方法,具体是在vue构造函数那里，会进行一些方法的混入,至于为什么不直接vm.$on，猜测是借鉴了单例模式，同一时间只会有一个父组件的子组件在创建
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  target = undefined
}

export function eventsMixin(Vue) {
  const hookRE = /^hook:/  // 用于处理写在标签上的hook钩子
  Vue.prototype.$on = function (event, fn) {
    const vm = this
    if (Array.isArray(event)) {
      // 处理传入数组的情况，挨个遍历调用$On，这个$On就是 Vue.prototype.$on 
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      // 这里保存事件，之前initEvents的时候给vm上面初始化了_events，在这里把对应事件的处理方法存放在数组中
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }
  Vue.prototype.$once = function (event, fn) {
    // 处理只调用一次的事件，原理其实还是利用$on 只不过把fn手动封装一下，让它执行逻辑的时候先在events中删除自身
    const vm = this
    function on() {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }
  Vue.prototype.$off = function (event, fn) {
    const vm = this
    if (!arguments.length) {
      // 不传参数直接清空所有的事件
      vm._events = Object.create(null)
      return vm
    }
    if (Array.isArray(event)) {
      // 数组入参挨个调用off
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    const cbs = vm._events[event] // 此处获得的是对应event的回调函数list
    if (!cbs) {
      return vm
    }
    if (!fn) {
      // 未指定具体删除哪一个回调函数，就把这个event底下的都清空
      vm._events[event] = null
      return vm
    }
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }
  Vue.prototype.$emit = function (event) {
    const vm = this
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = ''
      for (let i = 0, l = cbs.length; i < l; i++) {
        // 遍历对应事件底下的处理函数，这里用错误处理函数包裹
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
  }
}
