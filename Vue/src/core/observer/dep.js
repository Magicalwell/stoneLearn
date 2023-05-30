import { remove } from '../util/index'
let uid = 0
export default class Dep {
  constructor() {
    this.id = uid++
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }

  removeSub(sub) {
    remove(this.subs, sub)
  }

  depend() {
    // 如果当前有全局的watcher，则相当于在收集依赖，把自身添加到watcher中去
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify() {
    // 内容有变动，通知更新
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

Dep.target = null  // 这里存放当前全局的watcher
const targetStack = [] //watcher的栈

export function pushTarget(target) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget() {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}