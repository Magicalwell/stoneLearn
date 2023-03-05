export function initExtend(Vue) {
  Vue.cid = 0
  let cid = 1
  Vue.extend = function (extendOptions) {
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    const name = extendOptions.name || Super.options.name
    const Sub = function VueComponent(options) {
      this._init(options)
    }
  }
}