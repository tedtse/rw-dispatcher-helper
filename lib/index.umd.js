(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('lodash'), require('uuid/v4'), require('change-case'), require('vue')) :
    typeof define === 'function' && define.amd ? define(['exports', 'lodash', 'uuid/v4', 'change-case', 'vue'], factory) :
    (global = global || self, factory(global.RWDispatcherHelper = {}, global._, global.UUID, global.changeCase, global.Vue));
}(this, function (exports, _, UUID, changeCase, Vue) { 'use strict';

    _ = _ && _.hasOwnProperty('default') ? _['default'] : _;
    UUID = UUID && UUID.hasOwnProperty('default') ? UUID['default'] : UUID;
    Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

    var TickEmitter = /** @class */ (function () {
        function TickEmitter() {
            this.listening = false;
            this.tickList = [];
        }
        TickEmitter.prototype.on = function (id, callback, once) {
            if (callback === void 0) { callback = _.noop; }
            if (once === void 0) { once = false; }
            this.listen();
            this.tickList.push({
                id: id,
                callback: callback,
                once: once
            });
        };
        TickEmitter.prototype.once = function (id, callback) {
            if (callback === void 0) { callback = _.noop; }
            this.on(id, callback, true);
        };
        TickEmitter.prototype.off = function (id) {
            this.tickList = this.tickList.filter(function (item) { return item.id !== id; });
        };
        TickEmitter.prototype.listen = function () {
            if (this.listening) {
                return;
            }
            this.listening = true;
            this.next();
        };
        TickEmitter.prototype.next = function () {
            var _this = this;
            if (!this.listening) {
                return;
            }
            Vue.nextTick()
                .then(function () {
                _this.tickList.forEach(function (item) {
                    item.callback();
                    if (item.once) {
                        _this.off(item.id);
                    }
                });
                if (!_this.tickList.length) {
                    _this.listening = false;
                }
                // return this.next()
            });
        };
        return TickEmitter;
    }());

    var getRender = function (tag, options) {
        if (options === void 0) { options = {}; }
        return _.get(options, "readStateRender." + changeCase.camelCase(tag), _.noop);
    };
    var index = {
        // 读转态
        isReadState: function (state) {
            return state === 'read';
        },
        // 写状态
        isWriteState: function (state) {
            return state === 'write';
        },
        // 读转态且存在 readStateRender 插槽
        isReadStateAndSlotRender: function (context, state, options) {
            var renderKey = changeCase.camelCase(options.namespace + "Render");
            return this.isReadState(state) && _.get(context, "scopedSlots." + renderKey, false);
        },
        // 读状态且存在 readStateRender prop
        isReadStateAndPropRender: function (context, state, options) {
            var render = this.getDispatcherProp(context, options.namespace, 'render');
            return this.isReadState(state) && typeof render === 'function';
        },
        // 读转态且存在该组件的局部渲染函数
        isReadStateAndLocalRender: function (context, state, options, tag) {
            var namespace = options.namespace;
            var localConfig = _.get(context, "injections." + changeCase.camelCase(namespace) + "Provider." + changeCase.camelCase(namespace) + "Config", {});
            var render = getRender(tag, localConfig);
            return this.isReadState(state) && typeof render === 'function';
        },
        // 读转态且存在该组件的全局渲染函数
        isReadStateAndGlobalRender: function (context, state, options, tag) {
            var render = getRender(tag, options);
            return this.isReadState(state) && typeof render === 'function';
        },
        // 读转态且不存在 readStateRender 插槽
        isReadStateAndNotRener: function (context, state) {
            return this.isReadState(state) && _.get(context, 'scopedSlots.readStateRender', true);
        },
        getInjections: function (providerName) {
            var _a;
            return {
                inject: (_a = {},
                    _a[providerName] = {
                        default: function () { return {}; }
                    },
                    _a)
            };
        },
        getDispatcherProp: function (context, namespace, suffix) {
            var key = "" + changeCase.camelCase(namespace) + changeCase.titleCase(suffix);
            return _.get(context, "data.attrs." + changeCase.paramCase(key)) || _.get(context, "data.attrs." + changeCase.camelCase(key));
        },
        genReadStateClass: function (prefix, tag, size) {
            if (prefix === void 0) { prefix = ''; }
            var sizeEnd = size ? [tag + "--" + size] : [];
            var bems = [tag].concat(sizeEnd);
            var result = {};
            bems.forEach(function (key) {
                result[prefix + "-" + key] = true;
            });
            return result;
        },
        wrapContext: function (context, uuidAttribute, clsPrefix, clsSuffix) {
            var _a;
            if (clsPrefix === void 0) { clsPrefix = ''; }
            var uuid = UUID();
            var selfSize = _.get(context, 'data.attrs.size');
            var readStateData = {
                attrs: (_a = {}, _a[uuidAttribute] = uuid, _a),
                style: _.get(context, 'data.staticStyle'),
                'class': this.genReadStateClass(clsPrefix, clsSuffix, selfSize)
            };
            return { uuid: uuid, readStateData: readStateData };
        },
        findComponentByUuid: function (formItems, uuidAttribute, uuid) {
            // let uuidVnode!: VNode
            // let formItem: Vue | undefined
            var result;
            var travese = function (vnode) {
                var children = vnode.children || [];
                return children.some(function (item) {
                    if (_.get(item, "data.attrs." + uuidAttribute, '') === uuid) {
                        result = [item, vnode.context];
                        return true;
                    }
                    else if (item.children) {
                        travese(item);
                    }
                    return false;
                });
            };
            formItems.some(function (item) {
                return travese(item._vnode);
                // return travese((<any>item)._vnode)
            });
            return result;
        },
        findFormItems: function (parent) {
            var result = [];
            var travese = function (component) {
                component.$children.forEach(function (item) {
                    if (_.get(item, '$options.name', '') === 'ElFormItem') {
                        result.push(item);
                    }
                    else if (item.$children) {
                        travese(item);
                    }
                });
            };
            travese(parent);
            return result;
        },
        findComponentByName: function (child, name) {
            var parent = child.$parent;
            while (parent) {
                if (name === parent.$options.name) {
                    break;
                }
                else {
                    parent = parent.$parent;
                }
            }
            return parent;
        },
        genRenderRules: function (tag) {
            var _this = this;
            return [
                {
                    // 写转态
                    match: function (context, state, options) {
                        return (_this.isWriteState(state));
                    },
                    action: function (h, context) {
                        var data = context.data, children = context.children;
                        return h(tag, data, children);
                    }
                },
                {
                    // 读状态且存在 readStateRender 插槽
                    match: function (context, state, options) {
                        if (options === void 0) { options = {}; }
                        return (_this.isReadStateAndSlotRender(context, state, options));
                    },
                    action: function (h, context, options) {
                        if (options === void 0) { options = {}; }
                        var data = context.data, children = context.children;
                        var render = context.scopedSlots[changeCase.camelCase(options.namespace + "Render")] || _.noop;
                        return render({ data: data, children: children });
                    }
                },
                {
                    // 读状态且存在 readStateRender prop
                    match: function (context, state, options) {
                        if (options === void 0) { options = {}; }
                        return (_this.isReadStateAndPropRender(context, state, options));
                    },
                    action: function (h, context, options) {
                        if (options === void 0) { options = {}; }
                        var render = _this.getDispatcherProp(context, options.namespace, 'render');
                        return render(h, context);
                    }
                },
                {
                    // 读转态且存在该组件的局部渲染函数
                    match: function (context, state, options) {
                        if (options === void 0) { options = {}; }
                        return _this.isReadStateAndLocalRender(context, state, options, tag);
                    },
                    action: function (h, context, options) {
                        if (options === void 0) { options = {}; }
                        var namespace = options.namespace;
                        var localConfig = _.get(context, "injections." + changeCase.camelCase(namespace) + "Provider." + changeCase.camelCase(namespace) + "Config", {});
                        var render = getRender(tag, localConfig);
                        return render(h, context);
                    }
                },
                {
                    // 读转态且存在该组件的全局渲染函数
                    match: function (context, state, options) {
                        if (options === void 0) { options = {}; }
                        return _this.isReadStateAndGlobalRender(context, state, options, tag);
                    },
                    action: function (h, context, options) {
                        if (options === void 0) { options = {}; }
                        var render = getRender(tag, options);
                        return render(h, context.data);
                    }
                }
            ];
        }
    };

    exports.TickEmitter = TickEmitter;
    exports.default = index;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
