import { hasOwn } from 'shared/util'
function getType(fn) {
  const match = fn && fn.toString().match(functionTypeCheckRE)
  return match ? match[1] : ''
}

function isSameType(a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex(type, expectedTypes) {
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
export function validateProp(key, propOptions, propsData, vm) {
  // 这里获取的是子组件定义的prop
  const prop = propOptions[key]
  const absent = !hasOwn(propsData, key) //判断是否缺省值
  // 这里的value是父组件v-bind传递过来的值
  let value = propsData[key]
  const booleanIndex = getTypeIndex(Boolean, prop.type) //判断prop是否是布尔类型
}