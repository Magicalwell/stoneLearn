import { isNative } from "./env"
export let isUsingMicroTask = false
// 用来存放函数的数组
const callbacks = []
let pending = false
// flushCallbacks函数用于复制当前callback中的回调函数，并且执行，这样做的目的就是在上一轮异步函数执行过程
// 中，后续添加进来的回调函数不会接着执行，这样避免了递归嵌套nexttick导致的流程一直卡死的情况
function flushCallbacks() {
  // 阻止后续异步任务的开启
  pending = false
  const copies = callbacks.slice(0) //复制当前队列里的任务，当做一次同步任务执行
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}
let timerFunc
// 这里直接进行环境判断
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  // 当前环境支持promise
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
  }
  isUsingMicroTask = true
} else if (typeof MutationObserver !== 'undefined') {
  // 降级处理  用MutationObserver
  // MutationObserver 是用来对dom进行监听的，vue利用它则是创建了一些看不见的文本node节点
  // 当new MutationObserver的时候，返回一个新的MutationObserver，它会在dom变化的时候调用传入的函数
  let Counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(Counter))
  observer.observe(textNode, {
    characterData: true
  })
  // 调用timefunc的时候出发监听，调用flushcallbacks
  timerFunc = () => {
    Counter = (Counter + 1) % 2
    textNode.data = String(Counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined') {
  // node环境下的setimmediate
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0);
  }
}
// cb为传入的函数，ctx为传入的执行上下文，也就是用来绑定的this
export function nextTick(cb, ctx) {
  let _reslove
  callbacks.push(() => {
    if (cb) {
      // 用try catch包裹起来，防止出现错误阻碍其他的执行，这里的ctx在封装成$nexttick的时候，自动传入vm
      try {
        cb.call(ctx)
      } catch (error) {

      }
    } else if (_reslove) {
      _reslove(ctx)
    }
  })
  // 处理重复开启异步任务的情况；
  if (!pending) {
    pending = true
    timerFunc() // 不同异步任务的时间不同，在这个tick中调用nexttick添加到队列里面的，算为一批，合并成一个同步任务
  }
  // 下面的方法为了解决不传cb，直接空调用的情况下不阻塞的方法，就是传入一个空的promise
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _reslove = resolve
    })
  }
}