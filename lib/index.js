import _ from 'lodash';
import UUID from 'uuid/v4';
import { camelCase, paramCase as kebebCase, titleCase } from 'change-case';
export * from './tick-emitter';
var getRender = function (tag, options) {
    if (options === void 0) { options = {}; }
    return _.get(options, "readStateRender." + camelCase(tag));
};
export default {
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
        var renderKey = camelCase(options.namespace + "Render");
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
        var localConfig = _.get(context, "injections." + camelCase(namespace) + "Provider." + camelCase(namespace) + "Config", {});
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
        var key = "" + camelCase(namespace) + titleCase(suffix);
        return _.get(context, "data.attrs." + kebebCase(key)) || _.get(context, "data.attrs." + camelCase(key));
    },
    genReadStateClass: function (prefix, tag, size, modifierSeparator) {
        if (prefix === void 0) { prefix = ''; }
        var sizeEnd = size ? ["" + tag + modifierSeparator + size] : [];
        var elements = [tag].concat(sizeEnd);
        var result = {};
        elements.forEach(function (key) {
            result[prefix + "-" + key] = true;
        });
        return result;
    },
    wrapContext: function (context, uuidAttribute, clsPrefix, clsSuffix, modifierSeparator) {
        var _a;
        if (clsPrefix === void 0) { clsPrefix = ''; }
        var uuid = UUID();
        var selfSize = _.get(context, 'data.attrs.size');
        var readStateData = {
            attrs: (_a = {}, _a[uuidAttribute] = uuid, _a),
            style: _.get(context, 'data.staticStyle'),
            'class': this.genReadStateClass(clsPrefix, clsSuffix, selfSize, modifierSeparator)
        };
        return { uuid: uuid, readStateData: readStateData };
    },
    findComponentByUUID: function (formItems, uuidAttribute, uuid, tagName) {
        var _this = this;
        var uuidVnode;
        var formItem;
        var travese = function (vnode) {
            var children = vnode.componentOptions
                ? vnode.componentOptions.children || []
                : [];
            return children.some(function (item) {
                if (_.get(item, "data.attrs." + uuidAttribute, '') === uuid) {
                    uuidVnode = item;
                    formItem = _this.findComponentByName(vnode.componentInstance, tagName);
                    return true;
                }
                else if (item.componentOptions) {
                    travese(item);
                }
                return false;
            });
        };
        formItems.some(function (item) {
            return travese(item.$vnode);
        });
        return { uuidVnode: uuidVnode, formItem: formItem };
    },
    findFormItems: function (parent, name) {
        var result = [];
        var travese = function (component) {
            component.$children.forEach(function (item) {
                if (_.get(item, '$options.name', '') === name) {
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
        if (child === undefined || name === undefined) {
            return undefined;
        }
        var target = child;
        while (target) {
            if (name === target.$options.name) {
                break;
            }
            else {
                target = target.$parent;
            }
        }
        return target;
    },
    genRenderRules: function (tag) {
        var _this = this;
        return [
            {
                // 写转态
                match: function (context, state, options) {
                    if (options === void 0) { options = {}; }
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
                    var render = context.scopedSlots[camelCase(options.namespace + "Render")] || _.noop;
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
                    var localConfig = _.get(context, "injections." + camelCase(namespace) + "Provider." + camelCase(namespace) + "Config", {});
                    var render = getRender(tag, localConfig) || _.noop;
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
                    var render = getRender(tag, options) || _.noop;
                    return render(h, context);
                }
            }
        ];
    }
};
