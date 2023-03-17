import { initMixin } from "./init";
import { stateMixin } from './state'
function Vue(options) {
    let a = 1
    this._init(options)
}
initMixin(Vue) // 给构造函数拓展init方法
stateMixin(Vue)
export default Vue