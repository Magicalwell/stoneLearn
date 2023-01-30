import { initMixin } from "./init";
function Vue(options){
    let a = 1
    this._init(options)
}
initMixin(Vue)
export default Vue