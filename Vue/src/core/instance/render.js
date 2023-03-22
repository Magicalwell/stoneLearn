import { nextTick } from "../util/index"

export function renderMixin(Vue) {
    // 到这里才把nexttick挂载到原型上，并且自动填充了其中的一个参数为当前的vue实例
    // 但此时在initglobalapi上面，已经挂载了vue.nexttick = nexttick，这里的意义
    // 就是自动绑定一个参数
    Vue.prototype.$nextTick = function (fn) {
        return nextTick(fn, this)
    }
    // 挂载编译入口方法
    Vue.prototype._render = function () {
        const vm = this
        const { render, _parentVnode } = vm.$options //_parentVnode只有在自身是component时才会存在
        // 处理父组件的具名插槽、作用域插槽，保存在自身的$scopedSlots中去，这样的目的估计为了绑定this
        if (_parentVnode) {
            vm.$scopedSlots = normalizeScopedSlots(
                _parentVnode.data.scopedSlots,
                vm.$slots,
                vm.$scopedSlots
            )
        }
        vm.$vnode = _parentVnode
        let vnode
        try {
            // currentRenderingInstance用来确保异步组件不会执行多次resolve
            currentRenderingInstance = vm
            // 生成vnode，_renderProxy是之前_init的时候挂载的，指向vue实例自己
            vnode = render.call(vm._renderProxy, vm.$createElement)
        } catch (error) {
            vnode = vm._vnode
        } finally {
            currentRenderingInstance = null
        }

        if (Array.isArray(vnode) && vnode.length === 1) {
            vnode = vnode[0]
        }
        if (!(vnode instanceof VNode)) {
            vnode = createEmptyVNode()
        }
        vnode.parent = _parentVnode
        return vnode
    }
}
export function initRender(vm) {
    //清空节点vnode
    vm._vnode = null // 节点vnode
    vm._staticTrees = null //v-once节点vnode
    const options = vm.$options
    // 获得父节点的vnode和组件实例
    const parentVnode = vm.$vnode = options._parentVnode //父树中的占位节点
    const renderContext = parentVnode && parentVnode.context
    vm.$slots = resolveSlots(options._renderChildren, renderContext) //处理组件插槽，将dom转换到$slots上,用于处理默认插槽和具名插槽;这里的_renderChildren是父组件转换为vnode后，渲染函数中子组件的children，是需要分发的内容，也就是渲染函数第三个参数
    vm.$scopedSlots = emptyObject
    // 给组件添加两个创建组件的方法，这俩的区别是：
    // _c用于内部的render函数，不需要额外的标准化处理
    // $createElement表示的是用户自己编写的render函数，需要在内部重新标准化处理以下，但其实这俩内部都调用的是_createElement
    vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
    vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

    //处理attrs 和 listeners，分别拿到vnode中的data和_parentListeners，这个_parentListeners在编译到子组件的时候，会获取父组件在自身上绑定的事件
    // 并保存在_parentListeners中
    const parentData = parentVnode && parentVnode.data
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)

}