(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var isArray = Array.isArray;
    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key)
    }
    function isValidArrayIndex(val) {
        var n = parseFloat(String(val));
        return n >= 0 && Math.floor(n) === n && isFinite(val)
    }

    var config = ({
        /**
         * Option merge strategies (used in core/util/options)
         */
        optionMergeStrategies: Object.create(null)
    });

    var strats = config.optionMergeStrategies;
    var defaultStrat = function (parentVal, childVal) {
        return childVal === undefined
            ? parentVal
            : childVal
    };
    function mergeData(to, from) {
        if (!from) { return to }
        var key;
        var keys = Object.keys(from);
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            from[key];
            to[key];
            // if (!hasOwn(to,key)) {

            // }
        }
    }
    strats.data = function (parentVal,
        childVal,
        vm) {

        if (!vm) ; else if (parentVal || childVal) {
            return function mergedInstanceDataFn() {
                var instanceData = typeof childVal === 'function'
                    ? childVal.call(vm)
                    : childVal;
                var defaultData = typeof parentVal === 'function'
                    ? parentVal.call(vm)
                    : undefined;
                if (instanceData) {
                    return mergeData(instanceData, defaultData)
                } else {
                    return defaultData
                }
            }
        }
    };
    function mergeOptions(parent,
        child,
        vm) {
        var options = {};
        var key;
        for (key in parent) {
            mergeField(key);
        }
        for (key in child) {
            if (!hasOwn(parent, key)) {
                mergeField(key);
            }
        }
        function mergeField(key) {
            /*strats里面存了options中每一个属性（el、props、watch等等）的合并方法，先取出*/
            var strat = strats[key] || defaultStrat;
            /*根据合并方法来合并两个option*/
            options[key] = strat(parent[key], child[key], vm, key);
        }
        return options
    }

    function isNative(Ctor) {
      return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
    }

    // 用来存放函数的数组
    var callbacks = [];
    var pending = false;
    // flushCallbacks函数用于复制当前callback中的回调函数，并且执行，这样做的目的就是在上一轮异步函数执行过程
    // 中，后续添加进来的回调函数不会接着执行，这样避免了递归嵌套nexttick导致的流程一直卡死的情况
    function flushCallbacks() {
      // 阻止后续异步任务的开启
      pending = false;
      var copies = callbacks.slice(0); //复制当前队列里的任务，当做一次同步任务执行
      callbacks.length = 0;
      for (var i = 0; i < copies.length; i++) {
        copies[i]();
      }
    }
    var timerFunc;
    // 这里直接进行环境判断
    if (typeof Promise !== 'undefined' && isNative(Promise)) {
      // 当前环境支持promise
      var p = Promise.resolve();
      timerFunc = function () {
        p.then(flushCallbacks);
      };
    } else if (typeof MutationObserver !== 'undefined') {
      // 降级处理  用MutationObserver
      // MutationObserver 是用来对dom进行监听的，vue利用它则是创建了一些看不见的文本node节点
      // 当new MutationObserver的时候，返回一个新的MutationObserver，它会在dom变化的时候调用传入的函数
      var Counter = 1;
      var observer = new MutationObserver(flushCallbacks);
      var textNode = document.createTextNode(String(Counter));
      observer.observe(textNode, {
        characterData: true
      });
      // 调用timefunc的时候出发监听，调用flushcallbacks
      timerFunc = function () {
        Counter = (Counter + 1) % 2;
        textNode.data = String(Counter);
      };
    } else if (typeof setImmediate !== 'undefined') {
      // node环境下的setimmediate
      timerFunc = function () {
        setImmediate(flushCallbacks);
      };
    } else {
      timerFunc = function () {
        setTimeout(flushCallbacks, 0);
      };
    }
    // cb为传入的函数，ctx为传入的执行上下文，也就是用来绑定的this
    function nextTick(cb, ctx) {
      var _reslove;
      callbacks.push(function () {
        if (cb) {
          // 用try catch包裹起来，防止出现错误阻碍其他的执行，这里的ctx在封装成$nexttick的时候，自动传入vm
          try {
            cb.call(ctx);
          } catch (error) {

          }
        } else if (_reslove) {
          _reslove(ctx);
        }
      });
      // 处理重复开启异步任务的情况；
      if (!pending) {
        pending = true;
        timerFunc(); // 不同异步任务的时间不同，在这个tick中调用nexttick添加到队列里面的，算为一批，合并成一个同步任务
      }
      // 下面的方法为了解决不传cb，直接空调用的情况下不阻塞的方法，就是传入一个空的promise
      if (!cb && typeof Promise !== 'undefined') {
        return new Promise(function (resolve) {
          _reslove = resolve;
        })
      }
    }

    var uid = 0;
    function initMixin$1(Vue) {
        Vue.prototype._init = function (options) {
            var vm = this;
            // 这一步标记自身是vue实例，避免后续监听整个vue实例
            vm._isVue = true;
            vm._uid = uid++;
            if (options && options._isComponent) ; else {
                vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
            }
            vm._self = vm;
        };
    }
    function resolveConstructorOptions(Ctor) {
        // 这个函数的作用就是处理两种情况产生的vue实例，一种是new Vue出来的，一种是extend出来的
        // 在上面merge的时候传入的参数是vm.constructor，constructor指向的是当前对象的构造函数 vm._proto_指向的是当前对象的原型，
        // prototype是构造函数的属性，指向它的原型
        var options = Ctor.options;
        // 这里存在super的情况，并不是es6 class的那个super，而是在调用vue.extend的时候，会给实例新增一个属性，如下：
        // Vue.extend = function (extendOptions: Object): Function {
        //     ...
        //     Sub['super'] = Super  指向父类的构造函数
        //     ...
        //   }
        if (Ctor.super) ;
        return options
    }

    function Vue(options){
        this._init(options);
    }
    initMixin$1(Vue);

    var ASSET_TYPES = [
        'component',
        'directive',
        'filter'
    ];

    /*初始化mixin*/
    function initMixin(Vue) {
        /*https://cn.vuejs.org/v2/api/#Vue-mixin*/
        Vue.mixin = function (mixin) {
            /*mergeOptions合并optiuons*/
            this.options = mergeOptions(this.options, mixin);
        };
    }

    function initAssetRegisters(Vue) {
        ASSET_TYPES.forEach(function (type) {
            console.log(type,'-------');
        });
    }

    function set(target, key, val) {
        var ob = target.__ob__;
        // 这里处理的是$set([],key,val)的情况，也就是直接操作数组的下标，这时候手动用splice进行更新
        if (isArray(target) && isValidArrayIndex(key)) {
            // 处理长度变长的情况 直接修改length  key比length短的情况下不影响，splice做替换
            target.length = Math.max(target.length, key);
            target.splice(key, 1, val);
            // 这里直接返回，因为数组不做响应式处理，采用重写array的七个方法实现，而上面的splice已经是被重写过的
            return val
        }
        if (hasOwn(target, key)) {
            // 如果是对象，且在目标target上面已经存在，直接重新赋值然后返回，这里会触发target【key】的set方法，进入响应式
            target[key] = val;
            return val
        }
        // 这里考虑到vue实例被保存在数据中的情况，例如componentsis可以直接传入vue实例渲染出来，这种情况就不能监听，因为会重复
        if (target._isVue || (ob && ob.vmCount)) {
            return val
        }
        // 处理非响应式数据
        if (!ob) {
            target[key] = val;
            return val
        }
    }
    function del(target, key) {
        // 先判断目标是不是数组，key是不是数字
        if (isArray(target) && typeof key === 'number') {
            target.splice(key, 1); // 调用被重写的数组方法
            return
        }
        var ob = target.__ob__;
        if (target._isVue || (ob && ob.vmCount)) {
            return
        }
        // 没有key这个对象
        if (!hasOwn(target, key)) {
            return
        }
        delete target[key];
        if (!ob) {
            // 对象没有观察者，不是响应式，则直接返回啥也不做
            return
        }
        ob.dep.notify();
    }

    function initGlobalAPI(Vue) {
        Vue.set = set;
        Vue.delete = del; // 后面会取别名为vm.$delete
        Vue.nextTick = nextTick;
        Vue.options = Object.create(null);
        // 提前初始化了    'component',directive,filter
        ASSET_TYPES.forEach(function (type) {
            Vue.options[type + 's'] = Object.create(null);
        });

        // initUse(Vue) 初始化devtools
        initMixin(Vue); // 初始化mixin方法
        initAssetRegisters();
    }

    initGlobalAPI(Vue);

    return Vue;

}));
