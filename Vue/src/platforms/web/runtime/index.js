import { extend } from 'shared/util'
import Vue from 'core/index'
// 根据不同的平台挂载不同的方法，web环境挂载这些，其实内部是v-model v-show transtion
// extend(Vue.options.directives, platformDirectives)
// extend(Vue.options.components, platformComponents)
export default Vue
