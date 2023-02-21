
import { ASSET_TYPES } from 'shared/constants'
import { initMixin } from './mixin'
import { initUse } from './use'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { nextTick, extend } from '../util/index'
import builtInComponents from '../components/index'
export function initGlobalAPI(Vue) {
    Vue.set = set
    Vue.delete = del // 后面会取别名为vm.$delete
    Vue.nextTick = nextTick
    Vue.options = Object.create(null)
    // 提前初始化了    'component',directive,filter
    ASSET_TYPES.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })
    // 下面引入keepalive组件，extend方法并不是表面意义上的继承，而是复制对象，builtInComponents就是keepalive组件，extend把每一个key都复制给了options.components，key就是name,props,methods等一些vue实例中的属性,但他们整体都是作为一个叫keepalive对象加入到components中
    extend(Vue.options.components, builtInComponents)
    initUse(Vue)  // 给vue拓展vue.use方法
    initMixin(Vue) // 初始化mixin方法
    initExtend(Vue) // 初始化extend方法
    initAssetRegisters(Vue)
}