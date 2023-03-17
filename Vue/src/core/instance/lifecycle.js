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