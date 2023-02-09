
import { ASSET_TYPES } from 'shared/constants'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set } from '../observer/index'
export function initGlobalAPI(Vue) {
    Vue.options = Object.create(null)
    // 提前初始化了    'component',directive,filter
    ASSET_TYPES.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })
    Vue.set = set
    // initUse(Vue) 初始化devtools
    initMixin(Vue) // 初始化mixin方法
    initExtend(Vue) // 初始化extend方法
    initAssetRegisters(Vue)
}