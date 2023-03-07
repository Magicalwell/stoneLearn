import { mergeOptions, extend } from '../util/index'
import { ASSET_TYPES } from 'shared/constants'
export function initExtend(Vue) {
  Vue.cid = 0
  let cid = 1
  // extend是一种挂载组件的方式 类似于components，但是它会创建一个新的子类
  Vue.extend = function (extendOptions) {
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    const name = extendOptions.name || Super.options.name
    const Sub = function VueComponent(options) {
      this._init(options) // 给子类调用初始化方法，但走到这一步时，this指向子类本身，但本身还没任何方法
    }
    // 到此后续就和本身vue的初始化一样，拓展vue构造函数，挂载各种方法，合并options，初始化props等
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    // 继承父类的方法和属性
    Sub.cid = cid++
    Sub.options = mergeOptions(Super.options, extendOptions) // 正常new的时候合并的是传入的options和初始化的options，这里
    // 是父类的options和extend时传入的options
    Sub['super'] = Super
    // 到这里Sub的options已经合并了options，下面可以直接使用
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }
    // 把父类的方法挂给子类一份
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    });
    if (name) {
      Sub.options.components[name] = Sub
    }
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)
    cachedCtors[SuperId] = Sub
    return Sub
  }
}
function initProps(Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed(Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}