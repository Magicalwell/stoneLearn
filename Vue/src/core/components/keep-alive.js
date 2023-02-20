// 整个阶段都发生在编译阶段，因为需要在vnode中获取子实例，也要获取其tag、name等，在编译阶段才会出现vnode
import { getFirstComponentChild } from 'core/vdom/helpers/index'
function getComponentName(opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}
function matches(pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  return false
}
function pruneCache(keepAliveInstance, filter) {
  const { cache, keys, _vnode } = keepAliveInstance
  for (const key in cache) {
    const entry = cache[key]
    if (entry) {
      const name = entry.name
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}
function pruneCacheEntry(
  cache,
  key,
  keys,
  current
) {
  // 获取缓存中的实例，判断是不是当前的实例，通过tag，调用实例的$destroy方法销毁，再移除keys缓存中的数据
  const entry = cache[key]
  if (entry && (!current || entry.tag !== current.tag)) {
    entry.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}
const patternTypes = [String, RegExp, Array]
export default {
  name: 'keep-alive',
  abstract: true,
  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },
  methods: {
    cacheVNode() {
      const { cache, keys, vnodeToCache, keyToCache } = this
      if (vnodeToCache) {
        // 如果有新的vnode需要缓存
        const { tag, componentInstance, componentOptions } = vnodeToCache
        cache[keyToCache] = {
          name: getComponentName(componentOptions),
          tag, componentInstance
        }
        keys.push(keyToCache)
        if (this.max && keys.length > parseInt(this.max)) {
          // 缓存的数量超过了限制，销毁第一个，这里倒着加是因为取到数组中的第一个更简单
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
        this.vnodeToCache = null
      }
    }
  },
  created() {
    this.cache = Object.create(null)
    this.keys = []
  },
  mounted() {
    this.cacheVNode()
    // 这里主要是对include和exclude被修改的时候，对cache进行修正，更新符合规则的cache
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },
  render() {
    const slot = this.$slots.default;
    const vnode = getFirstComponentChild(slot)
    const componentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // 获取第一个vnode的名称  
      const name = getComponentName(componentOptions)
      const { include, exclude } = this
      // include和exclude可以接受的参数有三种类型，在下面依次针对每种进行判断，见matches方法
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }
      const { cache, keys } = this
      // 获取第一个vnode的key，如果没有那就通过tag标签名 + cid去生成key
      const key = vnode.key == null ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '') : vnode.key
      if (cache[key]) {
        // 如果已经缓存了，直接取出组件实例componentInstance给vnode，
        // 这里的componentInstance在后面会用于渲染阶段
        vnode.componentInstance = cache[key].componentInstance
        remove(keys, key)
        keys.push(key)
      } else {
        // 这里通过下面的两个字段缓存实例的vnode和key，在mounted阶段和update的时候，进行缓存到keys中
        this.vnodeToCache = vnode
        this.keyToCache = key
      }
      vnode.data.keepAlive = true
      // 标记vnode，等到渲染的时候走keepalive的渲染逻辑
    }
    // 兼容，没有vnode直接返回第一个子实例
    return vnode || (slot && slot[0])
  },
}