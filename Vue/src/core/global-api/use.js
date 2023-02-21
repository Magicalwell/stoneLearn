import { toArray } from '../util/index'
export function initUse(Vue) {
  Vue.use = function (plugin) {
    // 下面是旧版本的写法，因为import是引用，所以给plugin上面新增一个熟悉installed为true，其他地方也可以访问到
    // if (plugin.installed) {
    //   return
    // }
    // 新版本是通过在Vue实例上挂了一个安装组件的数组，判断数组里面有没有当前的plugin，因为new Vue只生成了一个vue实例，其他都是底下的子组件所以可以访问的到，这也解释了之前低代码项目通过new Vue出来的编辑器是无法直接使用渲染器中的组件
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }
    const args = toArray(arguments, 1)
    args.unshift(this) // 把自身vue实例放入参数里面，供插件的install(vue)取到vue实例
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}