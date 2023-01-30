
import { ASSET_TYPES } from 'shared/constants'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
export function initGlobalAPI(Vue) {
    Vue.options = Object.create(null)
    ASSET_TYPES.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })
    // initUse(Vue) 初始化devtools
    initMixin(Vue) // 初始化mixin方法
    initExtend(Vue) // 初始化extend方法
    initAssetRegisters(Vue)
}