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