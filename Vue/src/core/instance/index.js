import { initMixin } from "./init";
import { stateMixin } from './state'
import { eventsMixin } from './events'
function Vue(options) {
    let a = 1
    this._init(options)
}
initMixin(Vue) // 给构造函数拓展init方法
stateMixin(Vue) // 给构造函数原型上添加set del方法，并且添加watch
eventsMixin(Vue) // 给原型上挂载on once emit off等方法
export default Vue