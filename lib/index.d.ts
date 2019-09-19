import Vue, { CreateElement, RenderContext, VNode } from 'vue';
export * from './tick-emitter';
export declare type RWState = 'read' | 'write';
export declare type VueComponent = Vue | Element | Vue[] | Element[];
export interface ClassProps {
    [index: string]: boolean;
}
declare const _default: {
    isReadState(state: RWState): boolean;
    isWriteState(state: RWState): boolean;
    isReadStateAndSlotRender(context: RenderContext<Record<string, any>>, state: RWState, options: any): boolean;
    isReadStateAndPropRender(context: RenderContext<Record<string, any>>, state: RWState, options: any): boolean;
    isReadStateAndLocalRender(context: RenderContext<Record<string, any>>, state: RWState, options: any, tag: string): boolean;
    isReadStateAndGlobalRender(context: RenderContext<Record<string, any>>, state: RWState, options: any, tag: string): boolean;
    isReadStateAndNotRener(context: RenderContext<Record<string, any>>, state: RWState): any;
    getInjections(providerName: string | symbol): any;
    getDispatcherProp(context: RenderContext<Record<string, any>>, namespace: string, suffix: string): any;
    genReadStateClass(prefix: string | undefined, tag: string, size: string | undefined, modifierSeparator: string): any;
    wrapContext(context: RenderContext<Record<string, any>>, uuidAttribute: string, clsPrefix: string | undefined, clsSuffix: string, modifierSeparator: string): object;
    findComponentByUUID(formItems: Element[] | Vue[], uuidAttribute: string, uuid: string, tagName: string): any;
    findFormItems(parent: Vue, name: string): Vue[];
    findComponentByName(child: Vue, name: string): Vue | undefined;
    genRenderRules(tag: string): ({
        match: (context: RenderContext<Record<string, any>>, state: RWState, options?: any) => boolean;
        action: (h: CreateElement, context: RenderContext<Record<string, any>>) => VNode | VNode[];
    } | {
        match: (context: RenderContext<Record<string, any>>, state: RWState, options?: any) => boolean;
        action: (h: CreateElement, context: RWState, options?: any) => VNode | VNode[];
    })[];
};
export default _default;
