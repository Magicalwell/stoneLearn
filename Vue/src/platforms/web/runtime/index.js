import { extend } from 'shared/util'
import Vue from 'core/index'
import { inBrowser } from 'core/util/index'
import { patch } from './patch'
// 根据不同的平台挂载不同的方法，web环境挂载这些，其实内部是v-model v-show transtion
// extend(Vue.options.directives, platformDirectives)
// extend(Vue.options.components, platformComponents)
Vue.prototype.__patch__ = inBrowser ? patch : noop

Vue.prototype.$mount = function (el,hydrating) {
    console.log('1111111111');
}
export default Vue
