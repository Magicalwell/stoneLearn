import { hasOwn, hyphenate } from 'shared/util'
import { shouldObserve, observe } from '../observer/index'
const functionTypeCheckRE = /^\s*function (\w+)/
function getType(fn) {
  const match = fn && fn.toString().match(functionTypeCheckRE)
  return match ? match[1] : ''
}

function isSameType(a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex(type, expectedTypes) {
  // 因为type可能有多个值，是个数组
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}
function getPropDefaultValue(vm, prop, key) {
  //获取prop的默认值
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default
  // 判断父组件是不是传过来的key是不是undefined，如果是则直接返回，不走工厂函数
  if (vm && vm.$options.propsData && vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined) {
    return vm._props[key]
  }
  // function类型的prop
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}
export function validateProp(key, propOptions, propsData, vm) {
  // 这里获取的是子组件定义的prop
  const prop = propOptions[key]
  const absent = !hasOwn(propsData, key) //判断是否缺省值
  // 这里的value是父组件v-bind传递过来的prop值
  let value = propsData[key]
  const booleanIndex = getTypeIndex(Boolean, prop.type) //判断prop是否是布尔类型，或是否是给出类型数组中有布尔类型
  if (booleanIndex > -1) {
    // type为boolen时，判断是否有defalut，没有给一个默认的false
    if (absent && !hasOwn(prop, 'default')) {
      value = false
    } else if (value === '' || value === hyphenate(key)) {
      // 值为空或与属性名相同 例如<student name="Kate" nick-name></student> nickname省略了值，默认为和属性名相同，很多组件库都有这种用法
      const stringIndex = getTypeIndex(String, prop.type)
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true
      }
    }
  }
  if (value === undefined) {
    // 父组件没传值过来，取prop的默认值default
    value = getPropDefaultValue(vm, prop, key)
    const prevShouldObserve = shouldObserve  //拿到观测开关
    // 之前在initprop中，非根组件会先关闭响应式的开关，这里要打开，因为传递过来的值需要响应式，相当于一个data
    toggleObserving(true)
    observe(value) // 默认为对象或vnode则响应式观测一下
    toggleObserving(prevShouldObserve)
  }
  return value
}