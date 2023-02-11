
import { ASSET_TYPES } from 'shared/constants'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { nextTick } from '../util/index'
export function initGlobalAPI(Vue) {
    Vue.set = set
    Vue.delete = del // 后面会取别名为vm.$delete
    Vue.nextTick = nextTick
    Vue.options = Object.create(null)
    // 提前初始化了    'component',directive,filter
    ASSET_TYPES.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })

    // initUse(Vue) 初始化devtools
    initMixin(Vue) // 初始化mixin方法
    initExtend(Vue) // 初始化extend方法
    initAssetRegisters(Vue)
}