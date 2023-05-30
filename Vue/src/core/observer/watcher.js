import {
    parsePath,
    _Set as Set,
    noop
} from '../util/index'
// 首先watcher有很多个，就需要uid
let uid = 0
export default class Watcher {
    constructor(vm, expOrFn, cb, options, isRenderWatcher) {
        this.vm = vm
        if (isRenderWatcher) {
            //判断是不是渲染watcher,渲染watcher会传这第五个参数
            vm._watcher = this
        }
        vm._watchers.push(this) //缓存watcher，便于之后销毁，里面存放的是三种watcher，不是说就只有三个，数量不限但是是三种之一。注意渲染watcher确实只有一个
        if (options) {
            this.deep = !!options.deep
            this.user = !!options.user
            this.lazy = !!options.lazy
            this.sync = !!options.sync
            this.before = options.before //钩子函数，在watcher更新前执行
        } else {
            this.deep = this.user = this.lazy = this.sync = false
        }
        this.cb = cb
        this.id = ++uid
        this.active = true
        this.dirty = this.lazy // 是否缓存
        this.deps = []
        this.newDeps = [] //同上面的deps用来判断对比哪些dep是不需要了的，用于条件渲染v-if的时候更新依赖。
        this.depIds = new Set()
        this.newDepIds = new Set()
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn
        } else {
            this.getter = parsePath(expOrFn)
            if (!this.getter) {
                this.getter = noop
            }
        }
        // 缓存的情况下 只有通过计算方法才会返回新的value，否则就是undefined
        this.value = this.lazy
            ? undefined
            : this.get()
    }
    evaluate() {
        this.value = this.get()
        this.dirty = false
    }
}