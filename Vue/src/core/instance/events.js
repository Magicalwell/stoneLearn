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
