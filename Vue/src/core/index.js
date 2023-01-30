import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
initGlobalAPI(Vue)
// 在这里提前拓展了一些属性和方法：例如filter component directive  在component里面有keepalive
// set delete nexttick和其他的一些方法  这些方法属性在这里提前拓展出来是为了供后面使用
// 初始化了mixin混入的方法，查看源码其实就是执行了mergeoptions并重新给this.options赋值进行替换
export default Vue