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
    function extend(to, _from) {
        for (var key in _from) {
            to[key] = _from[key];
        }
        return to
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
            /*strats????????????options?????????????????????el???props???watch????????????????????????????????????*/
            var strat = strats[key] || defaultStrat;
            /*?????????????????????????????????option*/
            options[key] = strat(parent[key], child[key], vm, key);
        }
        return options
    }

    function isNative(Ctor) {
      return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
    }

    // ???????????????????????????
    var callbacks = [];
    var pending = false;
    // flushCallbacks????????????????????????callback????????????????????????????????????????????????????????????????????????????????????????????????
    // ???????????????????????????????????????????????????????????????????????????????????????nexttick????????????????????????????????????
    function flushCallbacks() {
      // ?????????????????????????????????
      pending = false;
      var copies = callbacks.slice(0); //???????????????????????????????????????????????????????????????
      callbacks.length = 0;
      for (var i = 0; i < copies.length; i++) {
        copies[i]();
      }
    }
    var timerFunc;
    // ??????????????????????????????
    if (typeof Promise !== 'undefined' && isNative(Promise)) {
      // ??????????????????promise
      var p = Promise.resolve();
      timerFunc = function () {
        p.then(flushCallbacks);
      };
    } else if (typeof MutationObserver !== 'undefined') {
      // ????????????  ???MutationObserver
      // MutationObserver ????????????dom??????????????????vue????????????????????????????????????????????????node??????
      // ???new MutationObserver??????????????????????????????MutationObserver????????????dom????????????????????????????????????
      var Counter = 1;
      var observer = new MutationObserver(flushCallbacks);
      var textNode = document.createTextNode(String(Counter));
      observer.observe(textNode, {
        characterData: true
      });
      // ??????timefunc??????????????????????????????flushcallbacks
      timerFunc = function () {
        Counter = (Counter + 1) % 2;
        textNode.data = String(Counter);
      };
    } else if (typeof setImmediate !== 'undefined') {
      // node????????????setimmediate
      timerFunc = function () {
        setImmediate(flushCallbacks);
      };
    } else {
      timerFunc = function () {
        setTimeout(flushCallbacks, 0);
      };
    }
    // cb?????????????????????ctx??????????????????????????????????????????????????????this
    function nextTick(cb, ctx) {
      var _reslove;
      callbacks.push(function () {
        if (cb) {
          // ???try catch??????????????????????????????????????????????????????????????????ctx????????????$nexttick????????????????????????vm
          try {
            cb.call(ctx);
          } catch (error) {

          }
        } else if (_reslove) {
          _reslove(ctx);
        }
      });
      // ??????????????????????????????????????????
      if (!pending) {
        pending = true;
        timerFunc(); // ?????????????????????????????????????????????tick?????????nexttick?????????????????????????????????????????????????????????????????????
      }
      // ?????????????????????????????????cb???????????????????????????????????????????????????????????????????????????promise
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
            // ????????????????????????vue?????????????????????????????????vue??????
            vm._isVue = true;
            vm._uid = uid++;
            if (options && options._isComponent) ; else {
                vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
            }
            vm._self = vm;
        };
    }
    function resolveConstructorOptions(Ctor) {
        // ??????????????????????????????????????????????????????vue??????????????????new Vue?????????????????????extend?????????
        // ?????????merge???????????????????????????vm.constructor???constructor??????????????????????????????????????? vm._proto_????????????????????????????????????
        // prototype?????????????????????????????????????????????
        var options = Ctor.options;
        // ????????????super?????????????????????es6 class?????????super??????????????????vue.extend??????????????????????????????????????????????????????
        // Vue.extend = function (extendOptions: Object): Function {
        //     ...
        //     Sub['super'] = Super  ???????????????????????????
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

    /*?????????mixin*/
    function initMixin(Vue) {
        /*https://cn.vuejs.org/v2/api/#Vue-mixin*/
        Vue.mixin = function (mixin) {
            /*mergeOptions??????optiuons*/
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
        // ??????????????????$set([],key,val)?????????????????????????????????????????????????????????????????????splice????????????
        if (isArray(target) && isValidArrayIndex(key)) {
            // ??????????????????????????? ????????????length  key???length???????????????????????????splice?????????
            target.length = Math.max(target.length, key);
            target.splice(key, 1, val);
            // ?????????????????????????????????????????????????????????????????????array????????????????????????????????????splice????????????????????????
            return val
        }
        if (hasOwn(target, key)) {
            // ??????????????????????????????target?????????????????????????????????????????????????????????????????????target???key??????set????????????????????????
            target[key] = val;
            return val
        }
        // ???????????????vue?????????????????????????????????????????????componentsis??????????????????vue??????????????????????????????????????????????????????????????????
        if (target._isVue || (ob && ob.vmCount)) {
            return val
        }
        // ????????????????????????
        if (!ob) {
            target[key] = val;
            return val
        }
    }
    function del(target, key) {
        // ?????????????????????????????????key???????????????
        if (isArray(target) && typeof key === 'number') {
            target.splice(key, 1); // ??????????????????????????????
            return
        }
        var ob = target.__ob__;
        if (target._isVue || (ob && ob.vmCount)) {
            return
        }
        // ??????key????????????
        if (!hasOwn(target, key)) {
            return
        }
        delete target[key];
        if (!ob) {
            // ?????????????????????????????????????????????????????????????????????
            return
        }
        ob.dep.notify();
    }

    var patternTypes = [String, RegExp, Array];
    var KeepAlive = {
      name: 'keep-alive',
      abstract: true,
      props: {
        include: patternTypes,
        exclude: patternTypes,
        max: [String, Number]
      }
    };

    var builtInComponents = {
      KeepAlive: KeepAlive
    };

    function initGlobalAPI(Vue) {
        Vue.set = set;
        Vue.delete = del; // ?????????????????????vm.$delete
        Vue.nextTick = nextTick;
        Vue.options = Object.create(null);
        // ??????????????????    'component',directive,filter
        ASSET_TYPES.forEach(function (type) {
            Vue.options[type + 's'] = Object.create(null);
        });
        // ????????????keepalive?????????extend???????????????????????????????????????????????????????????????builtInComponents??????keepalive?????????extend????????????key???????????????options.components???key??????name,props,methods?????????vue??????????????????,????????????????????????????????????keepalive???????????????components???
        extend(Vue.options.components, builtInComponents);
        console.log(Vue.options.components, builtInComponents, '>>>>>>>>>>');
        // initUse(Vue) ?????????devtools
        initMixin(Vue); // ?????????mixin??????
        initAssetRegisters();
    }

    initGlobalAPI(Vue);

    return Vue;

}));
