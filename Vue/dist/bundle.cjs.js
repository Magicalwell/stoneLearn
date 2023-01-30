(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key)
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

    var uid = 0;
    function initMixin$1(Vue) {
        Vue.prototype._init = function (options) {
            var vm = this;
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

    function initGlobalAPI(Vue) {
        Vue.options = Object.create(null);
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
