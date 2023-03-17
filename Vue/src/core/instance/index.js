import { initMixin } from "./init";
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
function Vue(options) {
    let a = 1
    this._init(options)
}
initMixin(Vue) // 给构造函数拓展init方法
stateMixin(Vue) // 给构造函数原型上添加set del方法，并且添加watch
eventsMixin(Vue) // 给原型上挂载on once emit off等方法
lifecycleMixin(Vue) //挂载_update方法用来更新dom
renderMixin(Vue) // 挂载$nexttick和生成vnode的_render方法
export default Vue