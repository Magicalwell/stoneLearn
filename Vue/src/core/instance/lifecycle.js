
export let activeInstance = null
export function setActiveInstance(vm) {
  // 保存上一个激活对象，把vm保存为当前的激活对象
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}
export function initLifecycle(vm) {
  const options = vm.$options
  let parent = options.parent //获取到父元素
  if (parent && !options.abstract) {
    // 这里判断本身是不是abstract节点，不是的话判断父节点是不是abstract，如果是一直向上获取直到遇到一个不是abstract的节点，然后把自己加入到parent的子节点列表中
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }
  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm  //因为有parent，所以根元素只能是parent或者再往上找

  vm.$children = [] // 初始化子节点list，供子节点把自己加入其中
  vm.$refs = {}
  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false

}

export function callHook(vm) {

}
export function lifecycleMixin(Vue) {
  // 这个方法就干了一件事，给原型上拓展更新dom的方法，也就是diff的入口
  Vue.prototype._update = function (vnode, hydrating) {
    const vm = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    // 保存激活组件实例对象，因为存在keep-alive的情况，再次调用则会还原
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    if (!prevVnode) {
      // 这里的prevvnode是上次更新/渲染生成的vnode，如果是第一次则没有
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false)
    } else {
      // 更新vnode走到这里
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
  }

  Vue.prototype.$forceUpdate = function () {
    // 没啥好说的，手动触发更新
    const vm = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }
  Vue.prototype.$destory = function () {
    const vm = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestory')
    vm._isBeingDestroyed = true
    const parent = vm.$parent
    if (parent&& !parent._isBeingDestroyed&& !vm.$options.abstract) {
      // 获取到父节点，如果父节点存在且没有在销毁进程中，子节点本身也不是抽象节点的情况下，从父节点的children list中移除，如果子节点是抽象节点，在这个list中根本不会被添加
      remove(parent.$children,vm)
    }
    if (vm._watcher) {
      // 清除vm的watcher
      vm._watcher.teardown()
    }
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    vm._isDestroyed = true
    vm.__patch__(vm._vnode)
  }
}