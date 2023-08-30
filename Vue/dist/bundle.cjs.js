(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var isArray = Array.isArray;
    var emptyObject = Object.freeze({});
    var _toString = Object.prototype.toString;
    var camelizeRE = /-(\w)/g;

    var hyphenateRE = /\B([A-Z])/g;
    function noop$1(a, b, c) { }
    function isObject(obj) {
        return obj !== null && typeof obj === 'object'
    }
    var hyphenate = cached(function (str) {
        return str.replace(hyphenateRE, '-$1').toLowerCase()
    });

    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key)
    }
    function isUndef(v) {
        return v === undefined || v === null
    }
    // 判断传过来的数组下标是不是正确合理的值
    function isValidArrayIndex(val) {
        var n = parseFloat(String(val));
        return n >= 0 && Math.floor(n) === n && isFinite(val)
    }
    // 相当于一个浅拷贝
    function extend(to, _from) {
        for (var key in _from) {
            to[key] = _from[key];
        }
        return to
    }
    // 判断是否为空值
    function isDef(v) {
        return v !== undefined && v !== null
    }
    // 把类数组从指定的开头转为数组，这种写法兼容性很好
    function toArray(list, start) {
        start = start || 0;
        var i = list.length - start;
        var ret = new Array(i);
        while (i--) {
            ret[i] = list[i + start];
        }
        return ret
    }
    // 缓存方法，调用cached实际上调用的是return的一个自执行函数，里面能访问到cache
    function cached(fn) {
        var cache = Object.create(null);
        return (function cachedFn(str) {
            var hit = cache[str];
            return hit || (cache[str] = fn(str))
        })
    }

    var camelize = cached(function (str) {
        return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
    });
    // 借用对象上的tostring方法
    function isPlainObject(obj) {
        return _toString.call(obj) === '[object Object]'
    }

    function remove$2(arr, item) {
        if (arr.length) {
            var index = arr.indexOf(item);
            if (index > -1) {
                return arr.splice(index, 1)
            }
        }
    }

    function makeMap(
        str,
        expectsLowerCase
    ) {
        var map = Object.create(null);
        var list = str.split(',');
        for (var i = 0; i < list.length; i++) {
            map[list[i]] = true;
        }
        return expectsLowerCase
            ? function (val) { return map[val.toLowerCase()]; }
            : function (val) { return map[val]; }
    }

    var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

    function isReserved(str) {
      var c = (str + '').charCodeAt(0);
      return c === 0x24 || c === 0x5F
    }

    var bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));
    // 解析路径返回对应的对象  从对象中根据路径提取数据
    function parsePath(path) {
      if (bailRE.test(path)) {
        return
      }
      var segments = path.split('.');
      return function (obj) {
        for (var i = 0; i < segments.length; i++) {
          if (!obj) { return }
          obj = obj[segments[i]];
        }
        return obj
      }
    }
    // 代理方法，把某个key代理到对应的对象上
    function def(obj, key, val, enumerable) {
      Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
      });
    }

    var inBrowser = typeof window !== 'undefined';
    var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
    var nativeWatch = ({}).watch;
    var hasProto = '__proto__' in {};
    var hasSymbol =
      typeof Symbol !== 'undefined' && isNative(Symbol) &&
      typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);
    var _Set;
    var _isServer;
    function isNative(Ctor) {
      return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
    }
    var isServerRendering = function () {
      if (_isServer === undefined) {
        /* istanbul ignore if */
        if (!inBrowser && !inWeex && typeof global !== 'undefined') {
          // detect presence of vue-server-renderer and avoid
          // Webpack shimming the process
          _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
        } else {
          _isServer = false;
        }
      }
      return _isServer
    };

    var config = ({
        /**
         * Option merge strategies (used in core/util/options)
         */
        optionMergeStrategies: Object.create(null)
    });

    var uid$2 = 0;
    var Dep = function Dep() {
      this.id = uid$2++;
      this.subs = [];
    };
    Dep.prototype.addSub = function addSub (sub) {
      this.subs.push(sub);
    };

    Dep.prototype.removeSub = function removeSub (sub) {
      remove$2(this.subs, sub);
    };

    Dep.prototype.depend = function depend () {
      // 如果当前有全局的watcher，则相当于在收集依赖，把自身添加到watcher中去
      if (Dep.target) {
        Dep.target.addDep(this);
      }
    };

    Dep.prototype.notify = function notify () {
      // 内容有变动，通知更新
      var subs = this.subs.slice();
      for (var i = 0, l = subs.length; i < l; i++) {
        subs[i].update();
      }
    };

    Dep.target = null;  // 这里存放当前全局的watcher
    var targetStack = []; //watcher的栈

    function pushTarget(target) {
      targetStack.push(target);
      Dep.target = target;
    }

    function popTarget() {
      targetStack.pop();
      Dep.target = targetStack[targetStack.length - 1];
    }

    var VNode$1 = function VNode () {};
    var createEmptyVNode$1 = function (text) {
        if ( text === void 0 ) { text = ''; }

        var node = new VNode$1();
        node.text = text;
        node.isComment = true;
        return node
    };

    var arrayProto = Array.prototype;
    var arrayMethods = Object.create(arrayProto);

    // 几种对数组进行修改的方法，需要进行拓展，主动进行响应式的通知
    var methodsToPatch = [
        'push',
        'pop',
        'shift',
        'unshift',
        'splice',
        'sort',
        'reverse'
    ];
    // 这里不用es6箭头函数是因为this的指向问题,用箭头函数则this会指到window，而这里需要this指向当前的method
    // 为什么这里用function时，内部this为foreach的当前项？因为foreach内部实现其实就是遍历然后调用传入的函数，method传入的是this[i]，相当于是当前的项
    methodsToPatch.forEach(function (method) {
        var original = arrayProto[method]; //获取到原生的方法
        def(arrayMethods, method, function mutator() {
            var arguments$1 = arguments;

            var args = [], len = arguments.length;
            while ( len-- ) { args[ len ] = arguments$1[ len ]; }

            var result = original.apply(this, args); //先保有原生的方法逻辑，并调用一遍，在最后响应式逻辑执行完后返回。等同于切片重写
            var ob = this.__ob__;
            var inserted;
            switch (method) {
                case 'push':
                case 'unshift':
                    inserted = args;
                    break;
                case 'splice':
                    inserted = args.slice(2);
                    break;
            }
            if (inserted) { ob.observeArray(inserted); }
            ob.dep.notify();
            return result
        });
    });

    var arrayKeys = Object.getOwnPropertyNames(arrayMethods);
    var shouldObserve = true;  // 用于开启或关闭响应式数据的开关

    function toggleObserving$1(value) {
        shouldObserve = value;
    }
    var Observer = function Observer(value) {
        this.value = value;
        this.dep = new Dep();
        this.vmCount = 0;
        def(value, '__ob__', this); //把自己挂载value上的__ob__中去
        if (Array.isArray(value)) {
            // 这里处理数组，数组的响应式不是对每一项进行响应式处理，而是改写数组的一些修改方法，例如push等，在操作结束后手动去通知更新
            // 下面进行的判断是为了兼容某些环境下数组对象不继承object对象，这里有点疑问具体是哪些情况？有一种情况是通过object.create(null)创建的
            // 但是这里又是写死的判断，感觉这里可以近似看做是true
            if (hasProto) {
                protoAugment(value, arrayMethods);
            } else {
                copyAugment(value, arrayMethods, arrayKeys);
            }
            this.observeArray(value);
        } else {
            // 对象类型直接walk遍历去做响应式代理
            this.walk(value);
        }
    };
    Observer.prototype.walk = function walk (obj) {
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i]);
        }
    };
    Observer.prototype.observeArray = function observeArray (items) {
        for (var i = 0, l = items.length; i < l; i++) {
            observe(items[i]);
        }
    };

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
        // 逻辑走到这里就是正常的给一个对象中新增一个key，然后通知依赖了这个对象的watcher更新
        defineReactive(ob.value, key, val);
        ob.dep.notify();
        return val
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
    function observe(value, asRootData) {
        if (!isObject(value) || value instanceof VNode$1) {
            // 不是对象或vnode节点不观测，这里observe一般传入data
            return
        }
        var ob;
        if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
            // 如果已经被观测过，则直接拿来返回
            ob = value.__ob__;
        } else if (shouldObserve && !isServerRendering() && (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue) {
            // shouldObserve：这个变量控制着是否需要将变量转换为响应式数据。如果它的值为 false，则表示不需要将变量转换为响应式数据。当 Vue.js 初始化时，会根据用户传递的选项参数来决定 shouldObserve 的值。

            // !isServerRendering()：这个方法用来判断当前代码是否在服务器端渲染的环境中执行，如果是，则不能将变量转换为响应式数据。

            // (Array.isArray(value) || isPlainObject(value))：这个条件判断了变量的类型是否为数组或者纯对象，只有数组和纯对象才能被转换为响应式数据。

            // Object.isExtensible(value)：这个方法用来检查对象是否可以添加新的属性。只有能够添加新属性的对象才能被转换为响应式数据。

            // !value._isVue：这个条件判断了变量是否已经是 Vue 实例，如果是，则不需要再将它转换为响应式数据。
            ob = new Observer(value); // 创建观察者
        }
        if (asRootData && ob) {
            // 用来计数，表示ob被多少vue实例引用
            ob.vmCount++;
        }
        return ob
    }
    function defineReactive(obj, key, val, customSetter, shallow) {
        var dep = new Dep();  //dep可以理解为依赖管理器，每个属性都有，它保存依赖自身的watch，负责在更新时通知watch更新数据。
        // 判断key是不是object内置的，并且判断是否可以设置
        var property = Object.getOwnPropertyDescriptor(obj, key);
        // property返回的是属性的描述器，由value,writable,get,set,configurable,enumerable组成
        if (property && property.configurable === false) {
            return
        }
        var getter = property && property.get;
        var setter = property && property.set;
        // 判断只有setter且只传入了两个参数 obj和key的情况，手动给val给值
        if ((!getter || setter) && arguments.length === 2) {
            val = obj[key];
        }
        var childOb = !shallow && observe(val); // 是否递归将子对象的属性也转为get set
        // 下面就是耳熟能详的object.definedproperty
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get: function reactiveGetter() {
                var value = getter ? getter.call(obj) : val;
                // 如果目前有watcher在全局的target上，则收集依赖
                if (Dep.target) {
                    dep.depend();
                    if (childOb) {
                        // 有子对象，递归调用depend
                        childOb.dep.depend();
                        if (Array.isArray(value)) {
                            dependArray(value);
                        }
                    }
                }
                return value
            },
            set: function reactiveSetter(newVal) {
                var value = getter ? getter.call(obj) : val;
                // 下面的判断用于判断新值是否与旧值相等  第二个或的判断 自身与自身比较主要是为了判断NaN
                if (newVal === value || (newVal !== newVal && value !== value)) {
                    return
                }
                // 有getter没setter直接返回
                if (getter && !setter) { return }
                if (setter) {
                    setter.call(obj, newVal);
                } else {
                    val = newVal;
                }
                childOb = !shallow && observe(newVal);
                dep.notify();  //通知更新
            }
        });

    }
    function dependArray(value) {
        for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
            e = value[i];
            e && e.__ob__ && e.__ob__.dep.depend();
            if (Array.isArray(e)) {
                dependArray(e);
            }
        }
    }
    function protoAugment(target, src) {
        target.__proto__ = src;
    }
    function copyAugment(target, src, keys) {
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            def(target, key, src[key]);
        }
    }

    var strats = config.optionMergeStrategies;
    var defaultStrat = function (parentVal, childVal) {
        return childVal === undefined
            ? parentVal
            : childVal
    };
    function normalizeProps(options, vm) {
        var props = options.props;
        if (!props) { return } //没props跳过后续逻辑
        var res = {};
        var i, val, name;
        if (Array.isArray(props)) {
            // props为数组形式props:[list,data] 最终还是转为对象形式，只不过type:null
            i = props.length;
            // i--作为条件，当递减到0时转为布尔值为false
            while (i--) {
                val = props[i];
                if (typeof val === 'string') {
                    // 英文全转换小写
                    name = camelize(val);
                    res[name] = { type: null };
                }
            }
        } else if (isPlainObject(props)) {
            // props中为对象的情况下，判断单个props的值是否是对象，是就直接用，不是的情况可能是这样props:{list:array}
            for (var key in props) {
                val = props[key];
                name = camelize(key);
                res[name] = isPlainObject(val) ? val : { type: val };
            }
        }
        options.props = res; // 重新赋值
    }
    function normalizeInject(options, vm) {
        var inject = options.inject;
        if (!inject) { return }
        var normalied = options.inject = {};
        if (Array.isArray(inject)) {
            for (var i = 0; i < inject.length; i++) {
                normalied[inject[i]] = { from: inject[i] };
            }
        } else if (isPlainObject(inject)) {
            for (var key in inject) {
                var val = inject[key];
                normalied[key] = isPlainObject(val) ? extend({ from: key }, val) : { from: val };
            }
        }
    }
    function normalizeDirectives(options) {
        // 处理指令，如果存在则把指令的方法保存在bind和update上面
        var dirs = options.directives;
        if (dirs) {
            for (var key in dirs) {
                var def = dirs[key];
                if (typeof def === 'function') {
                    dirs[key] = { bind: def, update: def };
                }
            }
        }
    }
    function mergeData(to, from) {
        if (!from) { return to }
        var key, toVal, fromVal;
        // const keys = Object.keys(from)
        var keys = hasSymbol ? Reflect.ownKeys(from) : Object.keys(from);
        
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            if (key === '__ob__') { continue }
            toVal = to[key];
            fromVal = from[key];
            if (!hasOwn(to, key)) {
                set(to, key, fromVal);
            } else if (toVal !== fromVal && isPlainObject(toVal) && isPlainObject(fromVal)) {
                mergeData(toVal, fromVal);
            }
        }
        return to
    }
    function mergeDataOrFn(parentVal, childVal, vm) {
        if (!vm) ; else {
            return function mergedInstanceDataFn() {
                var instanceData = typeof childVal === 'function'
                    ? childVal.call(vm, vm)
                    : childVal;
                var defaultData = typeof parentVal === 'function'
                    ? parentVal.call(vm, vm)
                    : parentVal;
                if (instanceData) {
                    return mergeData(instanceData, defaultData)
                } else {
                    return defaultData
                }
            }
        }
    }
    strats.data = function (parentVal,
        childVal,
        vm) {

        // if (!vm) {
        //     return parentVal
        // } else if (parentVal || childVal) {
        //     return function mergedInstanceDataFn() {
        //         const instanceData = typeof childVal === 'function'
        //             ? childVal.call(vm)
        //             : childVal
        //         const defaultData = typeof parentVal === 'function'
        //             ? parentVal.call(vm)
        //             : undefined
        //         if (instanceData) {
        //             return mergeData(instanceData, defaultData)
        //         } else {
        //             return defaultData
        //         }
        //     }
        // }
        if (!vm) {
            if (childVal && typeof childVal !== 'function') {
                return parentVal
            }
            return mergeDataOrFn(parentVal, childVal)
        }
        return mergeDataOrFn(parentVal, childVal, vm)
    };
    function mergeOptions(parent,
        child,
        vm) {
        if (typeof child === 'function') {
            child = child.options;
        }
        // 格式化并校验子组件的props是不是合法
        normalizeProps(child);
        normalizeInject(child);
        normalizeDirectives(child);
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
            // strats里面预设了一些属性的合并策略，根据key值来确定用哪个方法
            var strat = strats[key] || defaultStrat;
            /*根据合并方法来合并两个option*/
            options[key] = strat(parent[key], child[key], vm, key);
        }
        return options
    }

    var functionTypeCheckRE = /^\s*function (\w+)/;
    function getType(fn) {
      var match = fn && fn.toString().match(functionTypeCheckRE);
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
      for (var i = 0, len = expectedTypes.length; i < len; i++) {
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
      var def = prop.default;
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
    function validateProp(key, propOptions, propsData, vm) {
      // 这里获取的是子组件定义的prop
      var prop = propOptions[key];
      var absent = !hasOwn(propsData, key); //判断是否缺省值
      // 这里的value是父组件v-bind传递过来的prop值
      var value = propsData[key];
      var booleanIndex = getTypeIndex(Boolean, prop.type); //判断prop是否是布尔类型，或是否是给出类型数组中有布尔类型
      if (booleanIndex > -1) {
        // type为boolen时，判断是否有defalut，没有给一个默认的false
        if (absent && !hasOwn(prop, 'default')) {
          value = false;
        } else if (value === '' || value === hyphenate(key)) {
          // 值为空或与属性名相同 例如<student name="Kate" nick-name></student> nickname省略了值，默认为和属性名相同，很多组件库都有这种用法
          var stringIndex = getTypeIndex(String, prop.type);
          if (stringIndex < 0 || booleanIndex < stringIndex) {
            value = true;
          }
        }
      }
      if (value === undefined) {
        // 父组件没传值过来，取prop的默认值default
        value = getPropDefaultValue(vm, prop, key);
        var prevShouldObserve = shouldObserve;  //拿到观测开关
        // 之前在initprop中，非根组件会先关闭响应式的开关，这里要打开，因为传递过来的值需要响应式，相当于一个data
        toggleObserving(true);
        observe(value); // 默认为对象或vnode则响应式观测一下
        toggleObserving(prevShouldObserve);
      }
      return value
    }

    function invokeWithErrorHandling$1(){}

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

    function initLifecycle(vm) {
      var options = vm.$options;
      var parent = options.parent; //获取到父元素
      if (parent && !options.abstract) {
        // 这里判断本身是不是abstract节点，不是的话判断父节点是不是abstract，如果是一直向上获取直到遇到一个不是abstract的节点，然后把自己加入到parent的子节点列表中
        while (parent.$options.abstract && parent.$parent) {
          parent = parent.$parent;
        }
        parent.$children.push(vm);
      }
      vm.$parent = parent;
      vm.$root = parent ? parent.$root : vm;  //因为有parent，所以根元素只能是parent或者再往上找

      vm.$children = []; // 初始化子节点list，供子节点把自己加入其中
      vm.$refs = {};
      vm._watcher = null;
      vm._inactive = null;
      vm._directInactive = false;
      vm._isMounted = false;
      vm._isDestroyed = false;
      vm._isBeingDestroyed = false;

    }

    function callHook(vm, hook) {
      // 同普通watcher一样，在执行时需要压入undefined进入Dep.target，防止添加多余的依赖
      pushTarget();
      var handlers = vm.$options[hook];
      if (handlers) {
        console.log(vm.test, '===============');
        handlers.call(vm);
        // for (let i = 0, j = handlers.length; i < j; i++) {
        //   // invokeWithErrorHandling(handlers[i], vm, null, vm, info)
        // }
      }
      if (vm._hasHookEvent) {
        vm.$emit('hook' + hook);
      }
      popTarget();
    }
    function lifecycleMixin(Vue) {
      // 这个方法就干了一件事，给原型上拓展更新dom的方法，也就是diff的入口
      Vue.prototype._update = function (vnode, hydrating) {
        var vm = this;
        var prevEl = vm.$el;
        var prevVnode = vm._vnode;
        vm._vnode = vnode;
        if (!prevVnode) {
          // 这里的prevvnode是上次更新/渲染生成的vnode，如果是第一次则没有
          vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false);
        } else {
          // 更新vnode走到这里
          vm.$el = vm.__patch__(prevVnode, vnode);
        }
        if (prevEl) {
          prevEl.__vue__ = null;
        }
        if (vm.$el) {
          vm.$el.__vue__ = vm;
        }
        if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
          vm.$parent.$el = vm.$el;
        }
      };

      Vue.prototype.$forceUpdate = function () {
        // 没啥好说的，手动触发更新
        var vm = this;
        if (vm._watcher) {
          vm._watcher.update();
        }
      };
      Vue.prototype.$destory = function () {
        var vm = this;
        if (vm._isBeingDestroyed) {
          return
        }
        callHook(vm, 'beforeDestory');
        vm._isBeingDestroyed = true;
        var parent = vm.$parent;
        if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
          // 获取到父节点，如果父节点存在且没有在销毁进程中，子节点本身也不是抽象节点的情况下，从父节点的children list中移除，如果子节点是抽象节点，在这个list中根本不会被添加
          remove(parent.$children, vm);
        }
        if (vm._watcher) {
          // 清除vm的watcher
          vm._watcher.teardown();
        }
        var i = vm._watchers.length;
        while (i--) {
          vm._watchers[i].teardown();
        }
        if (vm._data.__ob__) {
          vm._data.__ob__.vmCount--;
        }
        vm._isDestroyed = true;
        vm.__patch__(vm._vnode);
      };
    }
    function mountComponent(vm, el, hydrating) {
      vm.$el = el;
      if (!vm.$options.render) {
        vm.$options.render = createEmptyVNode$1;
      }
      // 由源代码可知，created到beforeMount之间，经历了绑定挂载的el真实dom，如果没有render函数，则默认给一个
      callHook(vm, 'beforeMount');
    }

    // updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)

    var normalizeEvent = cached(function (name) {
      var passive = name.charAt(0) === '&';
      name = passive ? name.slice(1) : name;
      var once = name.charAt(0) === '~';
      name = once ? name.slice(1) : name;
      var capture = name.charAt(0) === '!';
      name = capture ? name.slice(1) : name;
      return {
        name: name,
        once: once,
        capture: capture,
        passive: passive
      }
    });
    function updateListeners(on, oldOn, add, remove, createOnceHandler, vm) {
      // 这里是通过对比on oldon来根据对比结果调用add remove等进行新增和删除
      var name, cur, old, event;
      for (name in on) {
        // 此时on中是父组件在子组件标签上注册的一些事件监听方法，例如
        // { update:handleclick()... } 在创建阶段是没用oldOn的，所以只会调用add去新增
        cur = on[name];
        old = oldOn[name];
        event = normalizeEvent(name);
        if (isUndef(old)) {
          if (isUndef(cur.fns)) {
            cur = on[name] = createFnInvoker(cur, vm);
            //这里createFNinvoker是对cur这里的cur是父组件注册的方法，例如上面的handleclick，对它进行错误处理的封装再返回，这里处理错误可以被errorhandler捕获，也会被globalhandler捕获，类似于冒泡。

            // 详细解析见：https://blog.51cto.com/u_15478221/5225649?u_atoken=95983aad-b1c9-480a-ac31-b8c3104ab365&u_asession=01zokX2sQCrD-Z14s88G4xwkTODupIjexuurGvORBVQidwd_yDgakavPLf1pgwjp9iX0KNBwm7Lovlpxjd_P_q4JsKWYrT3W_NKPr8w6oU7K-8hPz3zR2xtRlUpgy4QxG37M7LQXJnBaowJRZr2iY6bGBkFo3NEHBv0PZUm6pbxQU&u_asig=05Z6NcKy0zBHRKYB83RslIJqE45Es8LK2wd1jdYRiabhT3Jvk_gXrXueO2p7GAOzY0PBWOXo5aYx-GYU_JdQyiG2uOMgFTX4gjEPzfV-NqvxLwRikCSiHNhTqp2gvr4Sq6NtAyG1t2H4cgJYTJNSY-UkdTr2aVFS-zP0Ypcu5M5CT9JS7q8ZD7Xtz2Ly-b0kmuyAKRFSVJkkdwVUnyHAIJzbyhGPmYJUjH3jKaNrMia9pBDO-7Y1XOloK66KZNgoNlBlbJZYb9ylbWGsgfAOaAnu3h9VXwMyh6PgyDIVSG1W_GMTF66FZzPhYiifVsGuEM3yLY6mZgdXquFtyGe0DhelDnwXxU8IQLmcKZe-eATWKxwDJpQPuCwf6y2Kp_geSJmWspDxyAEEo4kbsryBKb9Q&u_aref=EmgFkBq8YfikEKi514yNGHQ%2F2qE%3D
          }
          if (isTrue(event.once)) {
            cur = on[name] = createOnceHandler(event.name, cur, event.capture); //对$once的处理
          }
          add(event.name, cur, event.capture, event.passive, event.params);
        } else if (cur !== old) {
          old.fns = cur;
          on[name] = old;
        }

      }
      for (name in oldOn) {
        if (isUndef(on[name])) {
          // 新的不存在则调用删除
          event = normalizeEvent(name);
          remove(event.name, oldOn[name], event.capture);
        }
      }
    }

    function isAsyncPlaceholder(node) {
      return node.isComment && node.asyncFactory
    }

    function getFirstComponentChild(children) {
      if (Array.isArray(children)) {
        for (var i = 0; i < children.length; i++) {
          var c = children[i];
          if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
            return c
          }
        }
      }
    }

    var target;
    function add(event, fn) {
      target.$on(event, fn);
    }

    function remove$1(event, fn) {
      target.$off(event, fn);
    }
    function initEvents(vm) {
      //vue中的事件有两种，一种是组件事件，一种是原生事件，自定义组件上面定义的事件将走到这里。在父组件编译生成vnode的阶段，运行到自定义的子组件就会调用相应的方法createComponentInstanceForVnode进入到创建组件的逻辑去，这就会走到之前extend方法创建子类的逻辑中，new vnodeComponentOptions.Ctor(options)
      // 也就是const Sub = function VueComponent (options) {
      //   this._init(options)}
      // 再继续走到init初始化方法中的 initInternalComponent(vm, options)因为被标记了_isComponent，这个方法会给$options绑定_parentListeners
      vm._events = Object.create(null); //用于保存事件
      vm._hasHookEvent = false;  // 这个hook表示是否通过了@hook的方法把钩子绑定到了组件上
      var listeners = vm.$options._parentListeners;
      if (listeners) {
        updateComponentListeners(vm, listeners);
      }
    }

    function updateComponentListeners(vm, listeners, oldListeners) {
      target = vm;
      //这里的add,remove是之前在实例上挂载的$on $off方法,具体是在vue构造函数那里，会进行一些方法的混入,至于为什么不直接vm.$on，猜测是借鉴了单例模式，同一时间只会有一个父组件的子组件在创建
      updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
      target = undefined;
    }

    function eventsMixin(Vue) {
      var hookRE = /^hook:/;  // 用于处理写在标签上的hook钩子
      Vue.prototype.$on = function (event, fn) {
        var vm = this;
        if (Array.isArray(event)) {
          // 处理传入数组的情况，挨个遍历调用$On，这个$On就是 Vue.prototype.$on 
          for (var i = 0, l = event.length; i < l; i++) {
            vm.$on(event[i], fn);
          }
        } else {
          // 这里保存事件，之前initEvents的时候给vm上面初始化了_events，在这里把对应事件的处理方法存放在数组中
          (vm._events[event] || (vm._events[event] = [])).push(fn);
          if (hookRE.test(event)) {
            vm._hasHookEvent = true;
          }
        }
        return vm
      };
      Vue.prototype.$once = function (event, fn) {
        // 处理只调用一次的事件，原理其实还是利用$on 只不过把fn手动封装一下，让它执行逻辑的时候先在events中删除自身
        var vm = this;
        function on() {
          vm.$off(event, on);
          fn.apply(vm, arguments);
        }
        on.fn = fn;
        vm.$on(event, on);
        return vm
      };
      Vue.prototype.$off = function (event, fn) {
        var vm = this;
        if (!arguments.length) {
          // 不传参数直接清空所有的事件
          vm._events = Object.create(null);
          return vm
        }
        if (Array.isArray(event)) {
          // 数组入参挨个调用off
          for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
            vm.$off(event[i$1], fn);
          }
          return vm
        }
        var cbs = vm._events[event]; // 此处获得的是对应event的回调函数list
        if (!cbs) {
          return vm
        }
        if (!fn) {
          // 未指定具体删除哪一个回调函数，就把这个event底下的都清空
          vm._events[event] = null;
          return vm
        }
        var cb;
        var i = cbs.length;
        while (i--) {
          cb = cbs[i];
          if (cb === fn || cb.fn === fn) {
            cbs.splice(i, 1);
            break
          }
        }
        return vm
      };
      Vue.prototype.$emit = function (event) {
        var vm = this;
        var cbs = vm._events[event];
        if (cbs) {
          cbs = cbs.length > 1 ? toArray(cbs) : cbs;
          toArray(arguments, 1);
          for (var i = 0, l = cbs.length; i < l; i++) {
            // 遍历对应事件底下的处理函数，这里用错误处理函数包裹
            invokeWithErrorHandling$1(cbs[i]);
          }
        }
      };
    }

    function resolveSlots(){}

    function renderMixin(Vue) {
        // 到这里才把nexttick挂载到原型上，并且自动填充了其中的一个参数为当前的vue实例
        // 但此时在initglobalapi上面，已经挂载了vue.nexttick = nexttick，这里的意义
        // 就是自动绑定一个参数
        Vue.prototype.$nextTick = function (fn) {
            return nextTick(fn, this)
        };
        // 挂载编译入口方法
        Vue.prototype._render = function () {
            var vm = this;
            var ref = vm.$options;
            var render = ref.render;
            var _parentVnode = ref._parentVnode; //_parentVnode只有在自身是component时才会存在
            // 处理父组件的具名插槽、作用域插槽，保存在自身的$scopedSlots中去，这样的目的估计为了绑定this
            if (_parentVnode) {
                vm.$scopedSlots = normalizeScopedSlots(
                    _parentVnode.data.scopedSlots,
                    vm.$slots,
                    vm.$scopedSlots
                );
            }
            vm.$vnode = _parentVnode;
            var vnode;
            try {
                // currentRenderingInstance用来确保异步组件不会执行多次resolve
                currentRenderingInstance = vm;
                // 生成vnode，_renderProxy是之前_init的时候挂载的，指向vue实例自己
                vnode = render.call(vm._renderProxy, vm.$createElement);
            } catch (error) {
                vnode = vm._vnode;
            } finally {
                currentRenderingInstance = null;
            }

            if (Array.isArray(vnode) && vnode.length === 1) {
                vnode = vnode[0];
            }
            if (!(vnode instanceof VNode)) {
                vnode = createEmptyVNode();
            }
            vnode.parent = _parentVnode;
            return vnode
        };
    }
    function initRender(vm) {
        //清空节点vnode
        vm._vnode = null; // 节点vnode
        vm._staticTrees = null; //v-once节点vnode
        var options = vm.$options;
        // 获得父节点的vnode和组件实例
        var parentVnode = vm.$vnode = options._parentVnode; //父树中的占位节点
        parentVnode && parentVnode.context;
        vm.$slots = resolveSlots(options._renderChildren); //处理组件插槽，将dom转换到$slots上,用于处理默认插槽和具名插槽;这里的_renderChildren是父组件转换为vnode后，渲染函数中子组件的children，是需要分发的内容，也就是渲染函数第三个参数
        vm.$scopedSlots = emptyObject;
        // 给组件添加两个创建组件的方法，这俩的区别是：
        // _c用于内部的render函数，不需要额外的标准化处理
        // $createElement表示的是用户自己编写的render函数，需要在内部重新标准化处理以下，但其实这俩内部都调用的是_createElement
        vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
        vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

        //处理attrs 和 listeners，分别拿到vnode中的data和_parentListeners，这个_parentListeners在编译到子组件的时候，会获取父组件在自身上绑定的事件
        // 并保存在_parentListeners中
        var parentData = parentVnode && parentVnode.data;
        defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true);
        defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true);

    }

    // 首先watcher有很多个，就需要uid
    var uid$1 = 0;
    var Watcher = function Watcher(vm, expOrFn, cb, options, isRenderWatcher) {
        this.vm = vm;
        if (isRenderWatcher) {
            //判断是不是渲染watcher,渲染watcher会传这第五个参数
            vm._watcher = this;
        }
        vm._watchers.push(this); //缓存watcher，便于之后销毁，里面存放的是三种watcher，不是说就只有三个，数量不限但是是三种之一。注意渲染watcher确实只有一个
        if (options) {
            this.deep = !!options.deep;
            this.user = !!options.user;
            this.lazy = !!options.lazy;
            this.sync = !!options.sync;
            this.before = options.before; //钩子函数，在watcher更新前执行
        } else {
            this.deep = this.user = this.lazy = this.sync = false;
        }
        this.cb = cb;
        this.id = ++uid$1;
        this.active = true;
        this.dirty = this.lazy; // 是否缓存
        this.deps = [];
        this.newDeps = []; //同上面的deps用来判断对比哪些dep是不需要了的，用于条件渲染v-if的时候更新依赖。
        this.depIds = new _Set();
        this.newDepIds = new _Set();
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn;
        } else {
            this.getter = parsePath(expOrFn);
            if (!this.getter) {
                this.getter = noop$1;
            }
        }
        // 缓存的情况下 只有通过计算方法才会返回新的value，否则就是undefined
        this.value = this.lazy
            ? undefined
            : this.get();
    };
    Watcher.prototype.addDep = function addDep (dep) {
        var id = dep.id;
        if (!this.newDepIds.has(id)) {
            // 保存dep的id进字典，并且缓存dep，方便后续的操作
            // 这里的两个dep字典之前说过了，用来对比更新前后依赖的dep是否有变化，因为可能由于v-if条件渲染不同的内容，不被显示的没必要添加依赖
            this.newDepIds.add(id);
            this.newDeps.push(dep);
            if (!this.depIds.has(id)) {
                // 这里就是有变化了  需要建立依赖
                dep.addSub(this);
            }
        }
    };
    Watcher.prototype.evaluate = function evaluate () {
        this.value = this.get();
        this.dirty = false;
    };
    Watcher.prototype.depend = function depend () {
        var i = this.deps.length;
        while (i--) {
            this.deps[i].depend();
            // dep.target.adddep(this) 实际上是用当前全局的watcher调用adddep方法，收集dep
        }
    };

    var computedWatcherOptions = { lazy: true };
    var sharedPropertyDefinition = {
      enumerable: true,
      configurable: true,
      get: noop$1,
      set: noop$1
    };

    function proxy$1(target, sourceKey, key) {
      // 把key转换成描述器代理到target上，注意这里sourcekey为字符串，只能有一层例如a:{b:1,c:{d:2}},key只能代理bc不能d。再深的层级要在外部递归。
      sharedPropertyDefinition.get = function proxyGetter() {
        return this[sourceKey][key]
      };
      sharedPropertyDefinition.set = function proxySetter(val) {
        this[sourceKey][key] = val;
      };
      Object.defineProperty(target, key, sharedPropertyDefinition);
    }
    function createWatcher(vm, expOrFn, handler, options) {
      // 判断传入的handler也就是回调函数是不是对象，对应watch的一种写法：
      // message: {
      //   handler(){ }
      // }
      if (isPlainObject(handler)) {
        options = handler;
        handler = handler.handler; //取到对象中的handler作为回调
      }
      if (typeof handler === 'string') {
        handler = vm[handler]; //字符串直接取vm实例身上的
      }
      // 到这里的时候handler只能是函数形式的  vm.$watch其实就是再次调用Vue.prototype.$watch，只不过经过处理后，不会再走进isPlainObject(cb)判断中了
      return vm.$watch(expOrFn, handler, options)
    }
    function initProps$1(vm, propsOptions) {
      // 这里的propsData是由extend出来或者选项中给了才会有的，通常情况下为空，只是由子组件渲染逻辑出来的才有存,放父组件传入子组件的props,具体是在父组件创建vnode时，走到子组件的占位符这里然后就是子组件的创建逻辑，createComponent中  const propsData = extractPropsFromVNodeData(data, Ctor, tag)提取了父组件传递过来的props，然后创建vnode时当做属性传递进去，详见：https://juejin.cn/post/6844904160597377031
      var propsData = vm.$options.propsData || {};
      var props = vm._props = {}; // 用于保存后续添加的prop，这个属性是所有的prop，可以在vue中取到
      // 这里缓存key并且挂载到options上面，并且在这里保留一个指针keys方便调用
      var keys = vm.$options._propKeys = [];
      var isRoot = !vm.$parent;
      if (!isRoot) {
        // 如果不是根组件，那么取消对响应式数据的观测，这样是因为子组件只需要观测父组件传递下来的数据和内部的数据，等到后续操作完成后会重新开启响应式数据的观测
        toggleObserving$1(false);
      }
      for (var key in propsOptions) {
        keys.push(key); // keys是options._propKeys的引用，所以相当于把key压入options
        var value = validateProp(key, propsOptions, propsData, vm);
        defineReactive(props, key, value);
        if (!(key in vm)) {
          // 如果vm上面没有，则把_prop代理到vm上面，也这是为什么在代码中可以直接this.访问到prop
          proxy$1(vm, '_props', key);
        }
      }
      toggleObserving$1(true);
    }
    function initMethods(vm, methods) {
      // methods的处理逻辑很简单，通过bind改变this即可，然后挂载到vm上面
      for (var key in methods) {
        vm[key] = typeof methods[key] !== 'function' ? noop$1 : bind(methods[key], vm);
      }
    }
    function initData(vm) {
      var data = vm.$options.data;
      console.log(vm,'------------datadata-');
      data = vm._data = typeof data === 'function' ? getData(data, vm) : data || {};
      if (!isPlainObject(data)) {
        data = {};
      }
      var keys = Object.keys(data);
      var props = vm.$options.props;
      var methods = vm.$options.methods;
      var i = keys.length;
      while (i--) {
        var key = keys[i];
        // 这里分别判断data中的key是否和prop methods中有重复
        {
          if (methods && hasOwn(methods, key)) ;
        }
        if (props && hasOwn(props, key)) ; else if (!isReserved(key)) {
          proxy$1(vm, '_data', key);
        }
      }
      observe(data, true); // asRootData
    }
    function initComputed$1(vm, computed) {
      // 在vm上创建一个watcher数组用于保存计算属性的watcher
      var watchers = vm._computedWatchers = Object.create(null);
      var isSSR = isServerRendering();
      for (var key in computed) {
        var userDef = computed[key];
        //获取用户定义的计算属性，有两种方式，一种是a (return) 一种是以get和set方式写的是个对象
        var getter = typeof userDef === 'function' ? userDef : userDef.get;
        if (!isSSR) {
          watchers[key] = new Watcher(vm, getter || noop$1, noop$1, computedWatcherOptions);  //一个组件会有一套watcher，也就是那3中：渲染，计算，普通watcher,主要做了：1.让dep添加自己，自己也添加dep，2.数据更新
        }
        if (!(key in vm)) {
          defineComputed$1(vm, key, userDef); //处理计算属性，详细见下方
        }
      }

    }
    function createGetterInvoker(fn) {
      return function computedGetter() {
        return fn.call(this, this)
      }
    }
    function createComputedGetter(key) {
      return function computedGetter() {
        // 先获取计算属性的watcher  这个在初始化阶段就会有了  vue中有三个watcher  渲染阶段的render watcher  计算属性的watcher和普通的，这里this是组件实例
        //  initComputed const watchers = vm._computedWatchers = Object.create(null)
        var watcher = this._computedWatchers && this._computedWatchers[key];
        if (watcher) {
          // 这个dirty是watcher身上的属性,为true才会重新计算，这就是缓存的关键
          if (watcher.dirty) {
            watcher.evaluate();
          }
          // 用于收集访问到的属性的dep
          if (Dep.target) {
            watcher.depend();
          }
          return watcher.value
        }
      }
    }
    function initWatch(vm, watch) {
      for (var key in watch) {
        // 遍历用户定义的watch
        var handler = watch[key];
        if (Array.isArray(handler)) {
          // 这里是传入了数组，数组中每一项都是一个函数，这里进行处理挨个创建watcher
          for (var i = 0; i < handler.length; i++) {
            createWatcher(vm, key, handler[i]);
          }
        } else {
          createWatcher(vm, key, handler);
        }
      }
    }
    // 计算属性因为存在缓存，所以要做处理
    function defineComputed$1(target, key, userDef) {
      // 判断运行在什么平台上，服务端的话就不给缓存了，直接调用用错误处理工厂函数包装之后的用户定义的userDef
      var shouldCache = !isServerRendering();
      if (typeof userDef === 'function') {
        sharedPropertyDefinition.get = shouldCache ? createComputedGetter(key) : createGetterInvoker(userDef);
        sharedPropertyDefinition.set = noop$1;
      } else {
        // 用get和set方式定义的computed  先判断是否给了get然后走到跟上面一样的判断逻辑中
        sharedPropertyDefinition.get = userDef.get ? shouldCache && userDef.cache !== false ? createComputedGetter(key) : createGetterInvoker(userDef.get) : noop$1;
        sharedPropertyDefinition.set = userDef.set || noop$1;
      }
      Object.defineProperty(target, key, sharedPropertyDefinition);
    }
    function getData(data, vm) {
      pushTarget(); //将一个无效的undefined加入调用栈的顶部，以在操作响应式数据的时候不添加不必要的依赖
      try {
        return data.call(vm, vm)
      } catch (e) {
        handleError(e, vm, "data()");
        return {}
      } finally {
        popTarget();
      }
    }
    function stateMixin(Vue) {
      var dataDef = {};
      dataDef.get = function () { return this._data };
      var propsDef = {};
      propsDef.get = function () { return this._props };
      Object.defineProperty(Vue.prototype, '$data', dataDef);
      Object.defineProperty(Vue.prototype, '$props', propsDef);
      // vue构造函数上面已经有set del方法 initglobalapi方法挂载的，给原型上面也挂载上
      Vue.prototype.$set = set;
      Vue.prototype.$delete = del;
      // vue中有三个watch 一个是渲染watch 计算属性的watch  普通的watch，下面这个是普通的watch，就和vue选项中的watch一样
      Vue.prototype.$watch = function (expOrFn, cb, options) {
        // expOrFn, cb, options 依次为侦听的属性，回调函数，配置项deep等
        var vm = this;
        if (isPlainObject(cb)) {
          return createWatcher(vm, expOrFn, cb, options)
        }
        options = options || {};
        options.user = true; // 标记是哪种watch因为三种watch都是通过new Watch创建的
        var watcher = new Watcher(vm, expOrFn, cb, options);
        if (options.immediate) {
          var info = "callback for immediate watcher \"" + (watcher.expression) + "\"";
          pushTarget(); //将一个无效的undefined加入调用栈的顶部，以在操作响应式数据的时候不添加不必要的依赖
          invokeWithErrorHandling(cb, vm, [watcher.value], vm, info); // 还是通过错误处理包装后调用
          popTarget();
        }
      };
    }

    function initState(vm) {
      vm._watchers = [];
      var opts = vm.$options;
      // 下面依次进行props methods data computed watch的初始化
      if (opts.props) { initProps$1(vm, opts.props); }
      if (opts.methods) { initMethods(vm, opts.methods); }
      if (opts.data) {
        initData(vm);
      } else {
        observe(vm._data = {}, true);
      }
      if (opts.computed) { initComputed$1(vm, opts.computed); }
      if (opts.watch && opts.watch !== nativeWatch) {
        initWatch(vm, opts.watch);
      }
    }

    var uid = 0;
    function initMixin$1(Vue) {
        Vue.prototype._init = function (options) {
            var vm = this;
            // 这一步标记自身是vue实例，避免后续监听整个vue实例
            vm._isVue = true;
            vm._uid = uid++;
            if (options && options._isComponent) {
                initInternalComponent();
            } else {
                // 这里选项合并的对象是 initglobalApi中创建的那个options，里面有components filter directive 和new vue时传入的选项
                // 但刚刚initglobalApi的时候，提到了一个vue.extend的方法，这也是创建vue实例的方法之一，这里合并的时候就需要考虑到这种方式
                vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
            }
            vm._renderProxy = vm;
            vm._self = vm;
            initLifecycle(vm); // 初始化一些后续会用到的对象 例如parent,root _watcher等
            initEvents(vm); // 初始化事件系统 v-on 这里就指的是在父组件中引入了子组件 在其上面可以v-on或者@click等方式监听到事件，而子组件在编译的时候解析到标签时，会获取父组件在自己上面注册的事件并保留在vm.$options._parentListeners​​中
            initRender(vm); // 进行插槽的处理，创建组件两种方法的挂载，attrs和listeners的处理
            callHook(vm, 'beforeCreate'); //生命周期走到这里 创建了组件实例，进行了一些初始方法的挂载，获取到后续所需要的数据，例如事件，插槽等。
            // initInjections(vm) // 待完善
            initState(vm);
            // initProvide(vm) // resolve provide after data/props
            callHook(vm, 'created');

            if (vm.$options.el) {
                vm.$mount(vm.$options.el);
            }
        };
    }
    // resolveConstructorOptions用来返回类构造函数上面的最新的options
    function resolveConstructorOptions(Ctor) {
        // 这个函数的作用就是处理两种情况产生的vue实例，一种是new Vue出来的，一种是extend出来的
        // 在上面merge的时候传入的参数是vm.constructor，constructor指向的是当前对象的构造函数 vm._proto_指向的是当前对象的原型，
        // prototype是构造函数的属性，指向它的原型
        var options = Ctor.options;
        // 不管是new出来 还是extend出来，都会有options，区别是new出来是自己的，extend出来是已经合并过的
        // 这里存在super的情况，并不是es6 class的那个super，而是在调用vue.extend的时候，会给实例新增一个属性，如下：
        // Vue.extend = function (extendOptions: Object): Function {
        //     ...
        //     Sub['super'] = Super  指向父类的构造函数
        //     ...
        //   }
        if (Ctor.super) {
            var superOptions = resolveConstructorOptions(Ctor.super); // 父类可能也有父类，进行递归获得父类的options
            var cacheSuperOptions = Ctor.superOptions;
            if (superOptions !== cacheSuperOptions) {
                // 这俩不相等的情况是指父类还有父类  如果相等则说明传入的ctor已经是最高等级的类了，直接不走下方的逻辑，返回opitons即可
                // 在extend后父类的options发生了变化，把新的options更新到子类Sub上面去
                Ctor.superOptions = superOptions;  //父类的父类options
                var modifiedOptions = resolveConstructorOptions(Ctor);
                if (modifiedOptions) {
                    extend(Ctor.extendOptions, modifiedOptions);
                }
                options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
                if (options.name) {
                    // 合并之后的options有name 则在新opitons的组件对象中挂载  方便后续直接通过名称来引用
                    options.components[options.name] = Ctor;
                }
            }
        }
        return options
    }
    function initInternalComponent(vm, options) {
        console.log('in component');
    }

    function Vue(options) {
        this._init(options);
    }
    initMixin$1(Vue); // 给构造函数拓展init方法
    stateMixin(Vue); // 给构造函数原型上添加set del方法，并且添加watch
    eventsMixin(Vue); // 给原型上挂载on once emit off等方法
    lifecycleMixin(Vue); //挂载_update方法用来更新dom
    renderMixin(Vue); // 挂载$nexttick和生成vnode的_render方法

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
            return this
        };
    }

    function initUse(Vue) {
      Vue.use = function (plugin) {
        // 下面是旧版本的写法，因为import是引用，所以给plugin上面新增一个熟悉installed为true，其他地方也可以访问到
        // if (plugin.installed) {
        //   return
        // }
        // 新版本是通过在Vue实例上挂了一个安装组件的数组，判断数组里面有没有当前的plugin，因为new Vue只生成了一个vue实例，其他都是底下的子组件所以可以访问的到，这也解释了之前低代码项目通过new Vue出来的编辑器是无法直接使用渲染器中的组件
        var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
        if (installedPlugins.indexOf(plugin) > -1) {
          return this
        }
        var args = toArray(arguments, 1);
        args.unshift(this); // 把自身vue实例放入参数里面，供插件的install(vue)取到vue实例
        if (typeof plugin.install === 'function') {
          plugin.install.apply(plugin, args);
        } else if (typeof plugin === 'function') {
          plugin.apply(null, args);
        }
        installedPlugins.push(plugin);
        return this
      };
    }

    function initExtend(Vue) {
      Vue.cid = 0;
      var cid = 1;
      // extend是一种挂载组件的方式 类似于components，但是它会创建一个新的子类
      Vue.extend = function (extendOptions) {
        var Super = this;
        var SuperId = Super.cid;
        var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
        if (cachedCtors[SuperId]) {
          return cachedCtors[SuperId]
        }
        var name = extendOptions.name || Super.options.name;
        var Sub = function VueComponent(options) {
          this._init(options); // 给子类调用初始化方法，但走到这一步时，this指向子类本身，但本身还没任何方法
        };
        // 到此后续就和本身vue的初始化一样，拓展vue构造函数，挂载各种方法，合并options，初始化props等
        Sub.prototype = Object.create(Super.prototype);
        Sub.prototype.constructor = Sub;
        // 继承父类的方法和属性
        Sub.cid = cid++;
        Sub.options = mergeOptions(Super.options, extendOptions); // 正常new的时候合并的是传入的options和初始化的options，这里
        // 是父类的options和extend时传入的options
        Sub['super'] = Super;
        // 到这里Sub的options已经合并了options，下面可以直接使用
        if (Sub.options.props) {
          initProps(Sub);
        }
        if (Sub.options.computed) {
          initComputed(Sub);
        }
        // 把父类的方法挂给子类一份
        Sub.extend = Super.extend;
        Sub.mixin = Super.mixin;
        Sub.use = Super.use;
        ASSET_TYPES.forEach(function (type) {
          Sub[type] = Super[type];
        });
        if (name) {
          Sub.options.components[name] = Sub;
        }
        Sub.superOptions = Super.options;
        Sub.extendOptions = extendOptions;
        Sub.sealedOptions = extend({}, Sub.options);
        cachedCtors[SuperId] = Sub;
        return Sub
      };
    }
    function initProps(Comp) {
      var props = Comp.options.props;
      for (var key in props) {
        proxy(Comp.prototype, "_props", key);
      }
    }

    function initComputed(Comp) {
      var computed = Comp.options.computed;
      for (var key in computed) {
        defineComputed(Comp.prototype, key, computed[key]);
      }
    }

    function initAssetRegisters(Vue) {
        ASSET_TYPES.forEach(function (type) {
            console.log(type,'-------');
        });
    }

    // 整个阶段都发生在编译阶段，因为需要在vnode中获取子实例，也要获取其tag、name等，在编译阶段才会出现vnode
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
      var cache = keepAliveInstance.cache;
      var keys = keepAliveInstance.keys;
      var _vnode = keepAliveInstance._vnode;
      for (var key in cache) {
        var entry = cache[key];
        if (entry) {
          var name = entry.name;
          if (name && !filter(name)) {
            pruneCacheEntry(cache, key, keys, _vnode);
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
      var entry = cache[key];
      if (entry && (!current || entry.tag !== current.tag)) {
        entry.componentInstance.$destroy();
      }
      cache[key] = null;
      remove(keys, key);
    }
    var patternTypes = [String, RegExp, Array];
    var KeepAlive = {
      name: 'keep-alive',
      abstract: true,
      props: {
        include: patternTypes,
        exclude: patternTypes,
        max: [String, Number]
      },
      methods: {
        cacheVNode: function cacheVNode() {
          var ref = this;
          var cache = ref.cache;
          var keys = ref.keys;
          var vnodeToCache = ref.vnodeToCache;
          var keyToCache = ref.keyToCache;
          if (vnodeToCache) {
            // 如果有新的vnode需要缓存
            var tag = vnodeToCache.tag;
            var componentInstance = vnodeToCache.componentInstance;
            var componentOptions = vnodeToCache.componentOptions;
            cache[keyToCache] = {
              name: getComponentName(componentOptions),
              tag: tag, componentInstance: componentInstance
            };
            keys.push(keyToCache);
            if (this.max && keys.length > parseInt(this.max)) {
              // 缓存的数量超过了限制，销毁第一个，这里倒着加是因为取到数组中的第一个更简单
              pruneCacheEntry(cache, keys[0], keys, this._vnode);
            }
            this.vnodeToCache = null;
          }
        }
      },
      created: function created() {
        this.cache = Object.create(null);
        this.keys = [];
      },
      mounted: function mounted() {
        var this$1$1 = this;

        this.cacheVNode();
        // 这里主要是对include和exclude被修改的时候，对cache进行修正，更新符合规则的cache
        this.$watch('include', function (val) {
          pruneCache(this$1$1, function (name) { return matches(val, name); });
        });
        this.$watch('exclude', function (val) {
          pruneCache(this$1$1, function (name) { return !matches(val, name); });
        });
      },
      render: function render() {
        var slot = this.$slots.default;
        var vnode = getFirstComponentChild(slot);
        var componentOptions = vnode && vnode.componentOptions;
        if (componentOptions) {
          // 获取第一个vnode的名称  
          var name = getComponentName(componentOptions);
          var ref = this;
          var include = ref.include;
          var exclude = ref.exclude;
          // include和exclude可以接受的参数有三种类型，在下面依次针对每种进行判断，见matches方法
          if (
            // not included
            (include && (!name || !matches(include, name))) ||
            // excluded
            (exclude && name && matches(exclude, name))
          ) {
            return vnode
          }
          var ref$1 = this;
          var cache = ref$1.cache;
          var keys = ref$1.keys;
          // 获取第一个vnode的key，如果没有那就通过tag标签名 + cid去生成key
          var key = vnode.key == null ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '') : vnode.key;
          if (cache[key]) {
            // 如果已经缓存了，直接取出组件实例componentInstance给vnode，
            // 这里的componentInstance在后面会用于渲染阶段
            vnode.componentInstance = cache[key].componentInstance;
            remove(keys, key);
            keys.push(key);
          } else {
            // 这里通过下面的两个字段缓存实例的vnode和key，在mounted阶段和update的时候，进行缓存到keys中
            this.vnodeToCache = vnode;
            this.keyToCache = key;
          }
          vnode.data.keepAlive = true;
          // 标记vnode，等到渲染的时候走keepalive的渲染逻辑
        }
        // 兼容，没有vnode直接返回第一个子实例
        return vnode || (slot && slot[0])
      },
    };

    var builtInComponents = {
      KeepAlive: KeepAlive
    };

    function initGlobalAPI(Vue) {
        Vue.set = set;
        Vue.delete = del; // 后面会取别名为vm.$delete
        Vue.nextTick = nextTick;
        Vue.options = Object.create(null);
        // 提前初始化了    'component',directive,filter
        ASSET_TYPES.forEach(function (type) {
            Vue.options[type + 's'] = Object.create(null);
        });
        // 下面引入keepalive组件，extend方法并不是表面意义上的继承，而是复制对象，builtInComponents就是keepalive组件，extend把每一个key都复制给了options.components，key就是name,props,methods等一些vue实例中的属性,但他们整体都是作为一个叫keepalive对象加入到components中
        extend(Vue.options.components, builtInComponents);
        initUse(Vue);  // 给vue拓展vue.use方法
        initMixin(Vue); // 初始化mixin方法
        initExtend(Vue); // 初始化extend方法
        initAssetRegisters();
    }

    initGlobalAPI(Vue);

    function createPatchFunction() { }

    var patch = createPatchFunction();

    function query(el) {
        if (typeof el === 'string') {
            var selected = document.querySelector(el);
            if (!selected) {
                warn(
                    'Cannot find element: ' + el
                );
                return document.createElement('div')
            }
            return selected
        } else {
            return el
        }
    }

    // 根据不同的平台挂载不同的方法，web环境挂载这些，其实内部是v-model v-show transtion
    // extend(Vue.options.directives, platformDirectives)
    // extend(Vue.options.components, platformComponents)
    Vue.prototype.__patch__ = inBrowser ? patch : noop;

    Vue.prototype.$mount = function (el, hydrating) {
        console.log('1111111111');
        el = el && inBrowser ? query(el) : undefined;
        return mountComponent(this, el)
    };

    var baseOptions = {
        expectHTML: true,
        // modules,
        // directives,
        // isPreTag,
        // isUnaryTag,
        // mustUseProp,
        // canBeLeftOpenTag,
        // isReservedTag,
        // getTagNamespace,
        // staticKeys: genStaticKeys(modules)
    };

    function createFunction (code, errors) {
        try {
          return new Function(code)
        } catch (err) {
          errors.push({ err: err, code: code });
          return noop
        }
      }
      
    function createCompileToFunctionFn(compile) {
        var cache = Object.create(null);
        return function compileToFunctions(template, options, vm) {
            console.log(template, options, vm, 'template, options, vm');
            //delimiters为插值的分隔符，这里直接把字符串缓存到cache里面
            var key = options.delimiters
                ? String(options.delimiters) + template
                : template;
            if (cache[key]) {
                return cache[key]
            }
            var compiled = compile(template, options);
            var res = {};
            var fnGenErrors = [];
            res.render = createFunction(compiled.render,fnGenErrors);
            res.staticRenderFns = function () { };
            return (cache[key] = res)
        }
    }

    function createCompilerCreator(baseCompile) {
        return function createCompiler(baseOptions) {
            function compile(template, options) {
                var finalOptions = Object.create(baseOptions);

                for (var key in options) {
                    if (key !== 'modules' && key !== 'directives') {
                        finalOptions[key] = options[key];
                    }
                }
                var compiled = baseCompile(template.trim(), finalOptions);
                return compiled
            }
            return {
                compile: compile,
                compileToFunctions: createCompileToFunctionFn(compile)
            }
        }
    }

    var isPlainTextElement = makeMap('script,style,textarea', true);

    var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
    var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
    var comment = /^<!\--/;
    var conditionalComment = /^<!\[/;
    var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
    var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
    var doctype = /^<!DOCTYPE [^>]+>/i;
    var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
    var startTagOpen = new RegExp(("^<" + qnameCapture));
    var startTagClose = /^\s*(\/?)>/;

    var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
    var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

    var decodingMap = {
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&amp;': '&',
        '&#10;': '\n',
        '&#9;': '\t',
        '&#39;': "'"
    };

    var isIgnoreNewlineTag = makeMap('pre,textarea', true);
    var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

    function decodeAttr(value, shouldDecodeNewlines) {
        var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
        return value.replace(re, function (match) { return decodingMap[match]; })
    }

    function parseHTML(html, options) {
        var stack = [];
        var expectHTML = options.expectHTML;
        var isUnaryTag = options.isUnaryTag || (function () { return false; });
        var index = 0;
        var last, lastTag;
        while (html) {
            last = html;
            // 针对一些特殊的元素标签做处理
            // lastTag 是一个变量，用于存储上一个解析的开始标签名。这个变量在解析过程中会被更新为当前解析的开始标签名
            // 它主要用来判断当前解析的光标是不是在一个标签的开始标签内部
            if (!lastTag || !isPlainTextElement(lastTag)) {
                var textEnd = html.indexOf('<'); // 判断html是不是由<开始，这里可能还有注释
                if (textEnd === 0) {
                    if (comment.test(html)) {
                        // 这里判断开头是<--的注释的情况下，找到注释的结尾
                        var commentEnd = html.indexOf('-->');
                        if (commentEnd >= 0) {
                            if (options.shouldKeepComment) {
                                // 是否保留注释
                                options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
                            }
                            advance(commentEnd + 3);
                            continue
                        }
                    }
                    // 条件注释，实际中没遇到过
                    if (conditionalComment.test(html)) {
                        var conditionalEnd = html.indexOf(']>');

                        if (conditionalEnd >= 0) {
                            advance(conditionalEnd + 2);
                            continue
                        }
                    }
                    // 程序运行到这里  下一个html就不会是注释了  但是还有其他特殊的字段需要判断
                    // doctype
                    var doctypeMatch = html.match(doctype);
                    if (doctypeMatch) {
                        advance(doctypeMatch[0].length);
                        continue
                    }
                    // 先检测结束标签 这里是为了处理嵌套结构下标签闭合的问题 如果先检测开始标签，那么可能存在无法判断结束标签是属于哪个开始标签
                    // 这里检测标签的原理是匹配合法的标签
                    var endTagMatch = html.match(endTag);
                    if (endTagMatch) {
                        console.log(endTagMatch, 'endTagendTagendTag');
                        var curIndex = index;
                        advance(endTagMatch[0].length);
                        parseEndTag(endTagMatch[1], curIndex, index);
                        continue
                    }

                    var startTagMatch = parseStartTag();
                    if (startTagMatch) {
                        // 对匹配的开始标签进行处理，因为属性和操作符都在开始标签的括号中，所以这里要比结束标签多一个处理解析的过程
                        handleStartTag(startTagMatch);
                        if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
                            advance(1);
                        }
                        continue
                    }
                }
                var text = (void 0), rest = (void 0), next = (void 0);
                if (textEnd >= 0) {
                    // 处理文本
                    rest = html.slice(textEnd);
                    while (
                        !endTag.test(rest) &&
                        !startTagOpen.test(rest) &&
                        !comment.test(rest) &&
                        !conditionalComment.test(rest)
                    ) {
                        next = rest.indexOf('<', 1);
                        if (next < 0) { break }
                        textEnd += next;
                        rest = html.slice(textEnd);
                    }
                    text = html.substring(0, textEnd);
                }
                if (textEnd < 0) {
                    text = html;
                }
                if (text) {
                    advance(text.length);
                }

                if (options.chars && text) {
                    options.chars(text, index - text.length, index);
                }
            } else {
                var endTagLength = 0;
                var stackedTag = lastTag.toLowerCase();
                var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
                // 用于处理html里面写了script的情况
                var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
                    endTagLength = endTag.length;
                    if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
                        text = text
                            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
                            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
                    }
                    if (shouldIgnoreFirstNewline(stackedTag, text)) {
                        text = text.slice(1);
                    }
                    if (options.chars) {
                        options.chars(text);
                    }
                    return ''
                });
                index += html.length - rest$1.length;
                html = rest$1;
                parseEndTag(stackedTag, index - endTagLength, index);
            }
            if (html === last) {
                options.chars && options.chars(html);
                break
            }
        }
        parseEndTag();
        function parseStartTag() {
            var start = html.match(startTagOpen);
            if (start) {
                var match = {
                    tagName: start[1],
                    attrs: [],
                    start: index
                };
                advance(start[0].length);
                var end, attr;
                // 这里匹配到开始标签后  advance进入到标签内  先判断是不是单个标签也就是 <test /> 这种写法，然后匹配属性 v-xxx等
                while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
                    attr.start = index; // 记录属性的起始点
                    advance(attr[0].length);  //计算属性的长度并更新index
                    attr.end = index;  // 记录属性的结束点
                    match.attrs.push(attr);
                }
                if (end) {
                    match.unarySlash = end[1];
                    advance(end[0].length);
                    match.end = index;
                    return match
                }
            }
        }
        function handleStartTag(match) {
            var tagName = match.tagName;
            var unarySlash = match.unarySlash;
            if (expectHTML) {
                console.log('11111111');
            }
            var unary = isUnaryTag(tagName) || !!unarySlash;  //自闭合标签的判断
            var l = match.attrs.length;
            var attrs = new Array(l);
            // match中的数据类似这样：[' v-model="test"', 'v-model', '=', 'test', undefined, undefined, index: 0]
            for (var i = 0; i < l; i++) {
                var args = match.attrs[i];
                // args的第二项是属性标签名 第四项是值
                var value = args[3] || args[4] || args[5] || '';
                var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
                    ? options.shouldDecodeNewlinesForHref
                    : options.shouldDecodeNewlines;
                attrs[i] = {
                    name: args[1],
                    value: decodeAttr(value, shouldDecodeNewlines)
                };
            }
            console.log(attrs,options, 'attrsattrs');
            if (!unary) {
                stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
                lastTag = tagName;  // 更新lastTag
            }

            if (options.start) {
                options.start(tagName, attrs, unary, match.start, match.end);
            }
        }
        // advance直接截取剩下的html
        function advance(n) {
            index += n;
            html = html.substring(n);
        }
        function parseEndTag(tagName, start, end) {
            var pos, lowerCasedTagName;
            if (start == null) { start = index; }
            if (end == null) { end = index; }

            if (tagName) {
                lowerCasedTagName = tagName.toLowerCase();
                for (pos = stack.length - 1; pos >= 0; pos--) {
                    // 这里遍历之前缓存解析的开始标签，注意这里是从第一个结束标签倒着遍历的
                    if (stack[pos].lowerCasedTag === lowerCasedTagName) {
                        break
                    }
                }
            } else {
                pos = 0;
            }

            if (pos >= 0) {
                for (var i = stack.length - 1; i >= pos; i--) {
                    if (options.end) {
                        options.end(stack[i].tag, start, end);
                    }
                }
                stack.length = pos;  // 确保堆栈数组只包含在当前处理位置之前的标签元素
                lastTag = pos && stack[pos - 1].tag; // pos为零，不会走到后面的逻辑
                // 如果pos不为0则表示上一个标签存在取出stack数组中索引为pos-1的元素并获取其标签名（tag属性）将其赋值给lastTag变量。如果pos为0，表示没有上一个标签，则将lastTag设为''（空字符串）。
            } else if (lowerCasedTagName === 'br') {
                // 这里单独判断br和p的原因是，这俩标签都可以写成</br>、</p>，都能换行，有些浏览器会把这俩解析，
                //  </br> 标签被正常解析为 <br> 标签，而</p>标签被正常解析为 <p></p> ，为了一致性这里单独判断
                if (options.start) {
                    options.start(tagName, [], true, start, end);
                }
            } else if (lowerCasedTagName === 'p') {
                if (options.start) {
                    options.start(tagName, [], false, start, end);
                }
                if (options.end) {
                    options.end(tagName, start, end);
                }
            }
        }
    }

    function pluckModuleFunction(modules, key) {
        return modules
            ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; })
            : []
    }
    function getAndRemoveAttr(
        el,
        name,
        removeFromMap
    ) {
        var val;
        if ((val = el.attrsMap[name]) != null) {
            var list = el.attrsList;
            for (var i = 0, l = list.length; i < l; i++) {
                if (list[i].name === name) {
                    list.splice(i, 1);
                    break
                }
            }
        }
        if (removeFromMap) {
            delete el.attrsMap[name];
        }
        return val
    }
    function getRawBindingAttr(el, name) {
        return el.rawAttrsMap[':' + name] ||
            el.rawAttrsMap['v-bind:' + name] ||
            el.rawAttrsMap[name]
    }
    function getBindingAttr(el, name, getStatic) {
        var dynamicValue =
            getAndRemoveAttr(el, ':' + name) ||
            getAndRemoveAttr(el, 'v-bind:' + name);
        if (dynamicValue != null) {
            return parseFilters(dynamicValue)
        } else if (getStatic !== false) {
            var staticValue = getAndRemoveAttr(el, name);
            if (staticValue != null) {
                return JSON.stringify(staticValue)
            }
        }
    }
    function addAttr(el, name, value, range, dynamic) {
        var attrs = dynamic
            ? (el.dynamicAttrs || (el.dynamicAttrs = []))
            : (el.attrs || (el.attrs = []));
        attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
        el.plain = false;
    }
    function getAndRemoveAttrByRegex(el, name) {
        var list = el.attrsList;
        for (var i = 0, l = list.length; i < l; i++) {
            var attr = list[i];
            if (name.test(attr.name)) {
                list.splice(i, 1);
                return attr
            }
        }
    }

    var slotRE = /^v-slot(:|$)|^#/;
    var stripParensRE = /^\(|\)$/g;
    var dynamicArgRE = /^\[.*\]$/;
    var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;
    var transforms;
    var preTransforms;
    var platformIsPreTag;
    var dirRE = /^v-|^@|^:|^#/;
    var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    var emptySlotScopeToken = "_empty_";

    function createASTElement(
        tag,
        attrs,
        parent
    ) {
        return {
            type: 1,
            tag: tag,
            attrsList: attrs,
            attrsMap: makeAttrsMap(attrs),
            rawAttrsMap: {},
            parent: parent,
            children: []
        }
    }
    function parse(template, options) {
        // warn = options.warn || baseWarn
        platformIsPreTag = options.isPreTag || (function (tag) { return tag === 'pre'; });
        var stack = [];
        var root;
        var currentParent;
        var inVPre = false;
        var inPre = false;
        transforms = pluckModuleFunction(options.modules, 'transformNode');
        preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
        function closeElement(element) {
            // 确保元素节点的末尾不会包含空格字符所对应的文本节点
            trimEndingWhitespace(element);
            // 判断是否不在v-pre中，且是否没有被处理
            if (!inVPre && !element.processed) {
                // 直接进行AST的解析处理
                element = processElement(element, options);
            }
            // 如果当前栈为空并且当前元素节点不是根节点  用来判断当前是否存在未闭合的非根节点
            // 当遇到一个标签的开始标签，就会入栈，该元素节点闭合时，会弹出栈顶的元素节点
            if (!stack.length && element !== root) {
                // 这里就是允许根节点同级的节点 要以if或else elseif的方式
                if (root.if && (element.elseif || element.else)) {
                    addIfCondition(root, {
                        exp: element.elseif,
                        block: element
                    });
                }
            }
            //处理当前元素和父元素的关系 同时处理在插槽里面的情况，将具名插槽元素存储在父元素的scopedSlots属性中
            if (currentParent && !element.forbidden) {
                if (element.elseif || element.else) {
                    processIfConditions(element, currentParent);
                } else {
                    if (element.slotScope) {
                        var name = element.slotTarget || '"default"'
                            ; (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
                    }
                    currentParent.children.push(element);
                    element.parent = currentParent;
                }
            }
        }
        function trimEndingWhitespace(el) {
            if (!inPre) {
                var lastNode;
                while (
                    (lastNode = el.children[el.children.length - 1]) &&
                    lastNode.type === 3 &&
                    lastNode.text === ' '
                ) {
                    el.children.pop();
                }
            }
        }
        parseHTML(template, {
            expectHTML: options.expectHTML,
            isUnaryTag: options.isUnaryTag,
            canBeLeftOpenTag: options.canBeLeftOpenTag,
            shouldDecodeNewlines: options.shouldDecodeNewlines,
            shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
            shouldKeepComment: options.comments,
            outputSourceRange: options.outputSourceRange,
            start: function start(tag, attrs, unary, start$1, end) {
                // parseHTML用来分割解析html字符串，整理为一个标准的层级结构，然后外面会传递过来几个方法，在每个html解析阶段调用
                var element = createASTElement(tag, attrs, currentParent);
                if (!root) {
                    root = element;
                }
                // 判断是否是该忽略的标签和是否在服务端环境
                if (isForbiddenTag(element) && !isServerRendering()) {
                    element.forbidden = true;
                }
                // 在编译阶段之前，先对模板的 AST 进行一些预转换操作  具体根据不同的模块进行具体的操作，一般来说这里
                // preTransforms数组中函数的值来自于createcomplier函数的参数，module的模块有解析class model style
                for (var i = 0; i < preTransforms.length; i++) {
                    element = preTransforms[i](element, options) || element;
                }
                // v-pre的处理
                if (!inVPre) {
                    processPre(element);
                    if (element.pre) {
                        inVPre = true;
                    }
                }
                // 函数判断当前元素的标签名是否是 <pre>
                if (platformIsPreTag(element.tag)) {
                    inPre = true;
                }
                if (inVPre) {
                    // 将元素的原始属性列表转换为属性对象数组，并对每个属性进行处理和转换。
                    processRawAttrs(element);
                } else if (!element.processed) {
                    // 这里就能看明白v-for 和 v-if的优先级
                    processFor(element);
                    processIf(element);
                    processOnce(element);
                }

                if (!root) {
                    root = element;
                }

                if (!unary) {
                    currentParent = element;
                    stack.push(element);
                } else {
                    closeElement(element);
                }
            },
            end: function end(tag, start, end$1) {
                var element = stack[stack.length - 1];
                // pop stack
                stack.length -= 1;
                currentParent = stack[stack.length - 1];
                closeElement(element);
            },
        });
        return root
    }
    function makeAttrsMap(attrs) {
        var map = {};
        for (var i = 0, l = attrs.length; i < l; i++) {
            map[attrs[i].name] = attrs[i].value;
        }
        return map
    }
    function processPre(el) {
        if (getAndRemoveAttr(el, 'v-pre') != null) {
            el.pre = true;
        }
    }
    function processRawAttrs(el) {
        var list = el.attrsList;
        var len = list.length;
        if (len) {
            var attrs = el.attrs = new Array(len);
            for (var i = 0; i < len; i++) {
                attrs[i] = {
                    name: list[i].name,
                    value: JSON.stringify(list[i].value)
                };
                if (list[i].start != null) {
                    attrs[i].start = list[i].start;
                    attrs[i].end = list[i].end;
                }
            }
        } else if (!el.pre) {
            el.plain = true;
        }
    }
    function processOnce(el) {
        var once = getAndRemoveAttr(el, 'v-once');
        if (once != null) {
            el.once = true;
        }
    }
    function parseFor(exp) {
        // 通过正则表达式匹配到v-for的格式   v-for="a in b"   v-for="(index,i) of b"
        var inMatch = exp.match(forAliasRE);
        if (!inMatch) { return }
        var res = {};
        res.for = inMatch[2].trim();
        var alias = inMatch[1].trim().replace(stripParensRE, '');  //stripParensRE正则用于匹配左括号或右括号，并去除
        var iteratorMatch = alias.match(forIteratorRE);  // 用于解构迭代源的别名以及其它可能存在的取值方式
        if (iteratorMatch) {
            res.alias = alias.replace(forIteratorRE, '').trim();
            res.iterator1 = iteratorMatch[1].trim();
            if (iteratorMatch[2]) {
                res.iterator2 = iteratorMatch[2].trim();
            }
        } else {
            res.alias = alias;
        }
        return res
    }
    function processFor(el) {
        var exp;
        if ((exp = getAndRemoveAttr(el, 'v-for'))) {
            var res = parseFor(exp);
            if (res) {
                extend(el, res);
            }
        }
    }
    // parseHtml的核心就是processElement
    function processElement(element, options) {
        //依次处理key ref slot component attrs
        processKey(element);
        // 标记节点是不是一个普通节点，即不包含任何动态绑定、键值、作用域插槽和属性列表，这样做的目的是
        // 在编译阶段进行优化，减少对这些节点的处理和更新操作，提高渲染性能
        element.plain = (
            !element.key &&
            !element.scopedSlots &&
            !element.attrsList.length
        );
        // 处理ref  把自己的引用挂载element上面  同时检查是否在v-for内，以保证唯一且正确的引用
        processRef(element);
        // 这里处理三种插槽 注意这三种为slot-scope  slot   v-slot    <slot>标签需要在子元素中处理
        processSlotContent(element);
        processSlotOutlet(element);
        // 处理 :is动态组件的情况
        processComponent(element);
        // 下面要进行属性的处理了，先进行预转换
        for (var i = 0; i < transforms.length; i++) {
            element = transforms[i](element, options) || element;
        }
        processAttrs(element);
        return element

    }
    function addIfCondition(el, condition) {
        if (!el.ifConditions) {
            el.ifConditions = [];
        }
        el.ifConditions.push(condition);
    }
    function processIf(el) {
        var exp = getAndRemoveAttr(el, 'v-if');
        // 获取元素节点上的 v-if 属性的值
        if (exp) {
            // 表示该元素节点是条件渲染的起始节点
            el.if = exp;
            // 将条件块的信息添加到元素节点的条件列表中，其中包括条件表达式和当前元素节点本身。
            addIfCondition(el, {
                exp: exp,
                block: el
            });
        } else {
            if (getAndRemoveAttr(el, 'v-else') != null) {
                el.else = true;
            }
            var elseif = getAndRemoveAttr(el, 'v-else-if');
            if (elseif) {
                el.elseif = elseif;
            }
        }
    }
    function processKey(el) {
        var exp = getBindingAttr(el, 'key');
        if (exp) {
            el.key = exp;
        }
    }
    function processRef(el) {
        // 提取并删除ref 挂载到el上面，同时判断是否在v-for内部
        var ref = getBindingAttr(el, 'ref');
        if (ref) {
            el.ref = ref;
            // 这里为了ref在v-for内部时能正确处理，以确保引用的唯一性和正确性
            el.refInFor = checkInFor(el);
        }
    }
    function checkInFor(el) {
        // 向上遍历，检查el中有没有parent，有没有for标记，这个for标记就是在有v-for指令时会存在的，一直向上找直到没有parent
        var parent = el;
        while (parent) {
            if (parent.for !== undefined) {
                return true
            }
            parent = parent.parent;
        }
        return false
    }
    function isForbiddenTag(el) {
        return (
            el.tag === 'style' ||
            (el.tag === 'script' && (
                !el.attrsMap.type ||
                el.attrsMap.type === 'text/javascript'
            ))
        )
    }

    function getSlotName(binding) {
        // 把v-slot: 或#替换为空，这样就只剩下name了，接着判断是否有name
        var name = binding.name.replace(slotRE, '');
        if (!name) {
            if (binding.name[0] !== '#') {
                name = 'default';
            }
        }
        // 判断是否是动态值
        return dynamicArgRE.test(name)
            ? { name: name.slice(1, -1), dynamic: true }
            : { name: ("\"" + name + "\""), dynamic: false }
    }
    function processSlotContent(el) {
        var slotScope;
        if (el.tag === 'template') {
            // 先处理作用域插槽的两种写法，只写scope的比较少见  获取到slot-scope的值并绑定在slotScope中
            slotScope = getAndRemoveAttr(el, 'scope');
            el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
        } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
            // el的标签不是template且存在slot - scope属性，则将其赋值给slotScope变量
            el.slotScope = slotScope;
        }
        // 处理具名插槽的名称   slot="xxx"
        var slotTarget = getBindingAttr(el, 'slot');
        if (slotTarget) {
            // 这里默认不给任何值时对应的是default
            el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
            // 这里判断slot的值是不是动态的 如果解析的emelent里面属性字典里面有:slot或v-bind:slot则做标记
            el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);
            // 如果不是template且没有slotscope  则直接给el的属性添加{name: 'slot', value: slotTarget}
            if (el.tag !== 'template' && !el.slotScope) {
                addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
            }
        }
        // 处理v-slot
        {
            if (el.tag === 'template') {
                //用正则去匹配v-slot:header  #footer  v-slot这三种写法
                var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
                if (slotBinding) {
                    var ref = getSlotName(slotBinding);
                    var name = ref.name;
                    var dynamic = ref.dynamic;
                    el.slotTarget = name;
                    el.slotTargetDynamic = dynamic;
                    el.slotScope = slotBinding.value || emptySlotScopeToken;
                }
            } else {
                // v-slot只能用在template或者组件上 这里处理在组件上的情况
                var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
                if (slotBinding$1) {
                    // 创建一个slotContainer元素，用于存储插槽的相关信息，保存在el上面
                    var slots = el.scopedSlots || (el.scopedSlots = {});
                    var ref$1 = getSlotName(slotBinding$1);
                    var name$1 = ref$1.name;
                    var dynamic$1 = ref$1.dynamic;
                    // 创建一个名为slotContainer的AST元素，类型为template，并将其存储在slots对象中的对应名称的属性上
                    var slotContainer = slots[name$1] = createASTElement('template', [], el);
                    slotContainer.slotTarget = name$1;
                    slotContainer.slotTargetDynamic = dynamic$1;
                    slotContainer.children = el.children.filter(function (c) {
                        if (!c.slotScope) {
                            // 找出那些没有slotScope属性的孩子节点，然后将它们的父节点指向slotContainer，并返回true，以便将它们作为slotContainer的孩子节点。
                            c.parent = slotContainer;
                            return true
                        }
                    });
                    slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
                    el.children = []; // 清空el.children数组，因为插槽内容将会从scopedSlots中取得。
                    el.plain = false; // 表示el不再是一个简单的静态节点，需要生成相应的渲染数据
                }
            }
        }

    }
    function processSlotOutlet(el) {
        if (el.tag === 'slot') {
            el.slotName = getBindingAttr(el, 'name');
        }
    }
    function processComponent(el) {
        var binding;
        if ((binding = getBindingAttr(el, 'is'))) {
            el.component = binding;
        }
        if (getAndRemoveAttr(el, 'inline-template') != null) {
            el.inlineTemplate = true;
        }
    }
    // 这里开始处理html解析后标签上的属性
    function processAttrs(el) {
        var list = el.attrsList;
        var i, l, name;
        for (i = 0, l = list.length; i < l; i++) {
            name = list[i].name;
            list[i].value;
            // dirRE来判断简写指令还是非简写，简写的情况下：
            // ^v-：以v-开头的指令。
            // 示例：v-if、v-for、v-bind等。
            // ^@：以@符号开头的指令。
            // 示例：@click、@input、@keyup.enter等。
            // ^:：以:符号开头的指令。
            // 示例：:value、:class、:style等。
            // ^\.：以.符号开头的指令。
            // 示例：.sync、.once、.native等。
            // ^#：以#符号开头的指令。
            // 示例：#ref、#slot、#key等。

            // 判断有这些指令，则代表有响应式数据
            if (dirRE.test(name)) {
                el.hasBindings = true; //标记有绑定
                parseModifiers(name.replace(dirRE, ''));  // 解析指令并把修饰符保留在modifiers中
            }
            console.log(list[i].name, el, '------list[i].name-----');
        }
    }
    function parseModifiers(name) {
        // /\.[^.\]]+(?=[^\]]*$)/g  匹配.字符+除.和]外的多个字符+正向肯定预查，用于限制修饰符不能包含]字符；这样确保匹配到的格式是正确的
        // 例如@click.stop
        var match = name.match(modifierRE);
        if (match) {
            var ret = {};
            match.forEach(function (m) { ret[m.slice(1)] = true; });
            return ret
        }
    }

    var createCompiler = createCompilerCreator(function baseCompile(
        template,
        options
    ) {
        var ast = parse(template.trim(), options);
        console.log( ast,'----------ddd-------');
        if (options.optimize !== false) {
            optimize(ast, options);
        }
        var code = generate(ast, options);
        return {
            ast: ast,
            render: code.render,
            staticRenderFns: code.staticRenderFns
        }
    });

    var ref = createCompiler(baseOptions);
    var compileToFunctions = ref.compileToFunctions;

    var idToTemplate = cached(function (id) {
        var el = query(id);
        return el && el.innerHTML
    });

    // 下面的mount保存的是Vue构造函数上面提供的mount，就是调用了mountComponent
    var mount = Vue.prototype.$mount;
    console.log(mount, '+++++++++++');
    Vue.prototype.$mount = function (el, hydrating) {
        el = el && query(el);
        if (el === document.body || el === document.documentElement) {
            return this
        }
        var options = this.$options;
        if (!options.render) {
            // 没有给render的情况下，判断有没有template，render优先级高一些
            var template = options.template;
            // 这里第一个template的判断逻辑可以看作是提前处理template
            if (template) {
                if (typeof template === 'string') {
                    if (template.charAt(0) === '#') {
                        //兼容模板是#app这种选择器的情况
                        template = idToTemplate(template);
                    }
                } else if (template.nodeType) {
                    template = template.innerHTML;
                } else {
                    return this
                }
            } else if (el) {
                template = getOuterHTML(el);
            }
            if (template) {
                // compileToFunctions方法接受模板和配置参数，返回render，具体看实现
                var ref = compileToFunctions(template, {
                    outputSourceRange: "development" !== 'production',
                    shouldDecodeNewlines: true,
                    shouldDecodeNewlinesForHref: true,
                    delimiters: undefined,
                    comments: undefined
                }, this);
                var render = ref.render;
                var staticRenderFns = ref.staticRenderFns;
                options.render = render;
                options.staticRenderFns = staticRenderFns;
            }
        }
        return mount.call(this, el, hydrating)
    };
    function getOuterHTML(el) {
        if (el.outerHTML) {
            return el.outerHTML
        } else {
            var container = document.createElement('div');
            container.appendChild(el.cloneNode(true));
            return container.innerHTML
        }
    }
    Vue.compile = compileToFunctions;

    return Vue;

}));
