import Vue, { CreateElement, RenderContext, VNode } from 'vue'
import _ from 'lodash'
import UUID from 'uuid/v4'
import { camelCase, paramCase as kebebCase, titleCase } from 'change-case'

export * from './tick-emitter'

const getRender: (tag: string, options: object) => Function =
  (tag: string, options: object = {}) => {
    return _.get(options, `readStateRender.${camelCase(tag)}`, _.noop)
  }

export type RWState = 'read' | 'write'
export type VueComponent = Vue | Element | Vue[] | Element[]
export interface ClassProps {
  [index: string]: boolean
}

export default {
  // 读转态
  isReadState (state: RWState): boolean {
    return state === 'read'
  },
  // 写状态
  isWriteState (state: RWState): boolean {
    return state === 'write'
  },
  // 读转态且存在 readStateRender 插槽
  isReadStateAndSlotRender (context: RenderContext, state: RWState, options: any): boolean {
    const renderKey: string = camelCase(`${options.namespace}Render`)
    return this.isReadState(state) && _.get(context, `scopedSlots.${renderKey}`, false)
  },
  // 读状态且存在 readStateRender prop
  isReadStateAndPropRender (context: RenderContext, state: RWState, options: any): boolean {
    const render: Function | undefined = this.getDispatcherProp(context, options.namespace, 'render')
    return this.isReadState(state) && typeof render === 'function'
  },
  // 读转态且存在该组件的局部渲染函数
  isReadStateAndLocalRender (context: RenderContext, state: RWState, options: any, tag: string): boolean {
    const { namespace } = options
    const localConfig: object = _.get(context, `injections.${camelCase(namespace)}Provider.${camelCase(namespace)}Config`, {})
    const render: Function | undefined = getRender(tag, localConfig)
    return this.isReadState(state) && typeof render === 'function'
  },
  // 读转态且存在该组件的全局渲染函数
  isReadStateAndGlobalRender (context: RenderContext, state: RWState, options: any, tag: string): boolean {
    const render: Function | undefined = getRender(tag, options)
    return this.isReadState(state) && typeof render === 'function'
  },
  // 读转态且不存在 readStateRender 插槽
  isReadStateAndNotRener (context: RenderContext, state: RWState) {
    return this.isReadState(state) && _.get(context, 'scopedSlots.readStateRender', true)
  },
  getInjections (providerName: string | symbol): any {
    return {
      inject: {
        [providerName]: {
          default () { return {} }
        }
      }
    }
  },
  getDispatcherProp (context: RenderContext, namespace: string, suffix: string): any {
    const key: string = `${camelCase(namespace)}${titleCase(suffix)}`
    return _.get(context, `data.attrs.${kebebCase(key)}`) || _.get(context, `data.attrs.${camelCase(key)}`)
  },
  genReadStateClass (prefix: string = '', tag: string, size: string | undefined): any {
    const sizeEnd: string[] = size ? [`${tag}--${size}`] : []
    const bems: string[] = [tag, ...sizeEnd]
    const result: ClassProps = {}
    bems.forEach(key => {
      result[`${prefix}-${key}`] = true
    })
    return result
  },
  wrapContext (context: RenderContext, uuidAttribute: string, clsPrefix: string = '', clsSuffix: string): object {
    const uuid: string = UUID()
    const selfSize: string | undefined = _.get(context, 'data.attrs.size')
    const readStateData: object = {
      attrs: { [uuidAttribute]: uuid },
      style: _.get(context, 'data.staticStyle'),
      'class': this.genReadStateClass(clsPrefix, clsSuffix, selfSize)
    }
    return { uuid, readStateData }
  },
  findComponentByUuid (formItems: Vue[] | Element[], uuidAttribute: string, uuid: string): [VNode, Vue | undefined] {
    // let uuidVnode!: VNode
    // let formItem: Vue | undefined
    let result!: [VNode, Vue | undefined]
    const travese = (vnode: VNode): boolean => {
      const children = vnode.children || []
      return children.some((item: VNode): boolean => {
        if (_.get(item, `data.attrs.${uuidAttribute}`, '') === uuid) {
          result = [item, vnode.context]
          return true
        } else if (item.children) {
          travese(item)
        }
        return false
      })
    }
    formItems.some((item: VueComponent): boolean => {
      return travese((item as any)._vnode)
      // return travese((<any>item)._vnode)
    })
    return result
  },
  findFormItems (parent: Vue): Vue[] {
    const result: Vue[] = []
    const travese = (component: Vue) => {
      component.$children.forEach((item: Vue) => {
        if (_.get(item, '$options.name', '') === 'ElFormItem') {
          result.push(item)
        } else if (item.$children) {
          travese(item)
        }
      })
    }
    travese(parent)
    return result
  },
  findComponentByName (child: Vue, name: string): Vue {
    let parent = child.$parent
    while (parent) {
      if (name === parent.$options.name) {
        break
      } else {
        parent = parent.$parent
      }
    }
    return parent
  },
  genRenderRules (tag: string) {
    return [
      {
        // 写转态
        match: (context: RenderContext, state: RWState, options: any = {}): boolean => (this.isWriteState(state)),
        action: (h: CreateElement, context: RenderContext): VNode | VNode[] => {
          const { data, children } = context
          return h(tag, data, children)
        }
      },
      {
        // 读状态且存在 readStateRender 插槽
        match: (context: RenderContext, state: RWState, options: any = {}): boolean => (this.isReadStateAndSlotRender(context, state, options)),
        action: (h: CreateElement, context: RenderContext, options: any = {}): VNode | VNode[] => {
          const { data, children } = context
          const render: Function = context.scopedSlots[camelCase(`${options.namespace}Render`)] || _.noop
          return render({ data, children })
        }
      },
      {
        // 读状态且存在 readStateRender prop
        match: (context: RenderContext, state: RWState, options: any = {}): boolean => (this.isReadStateAndPropRender(context, state, options)),
        action: (h: CreateElement, context: RenderContext, options: any = {}): VNode | VNode[] => {
          const render = this.getDispatcherProp(context, options.namespace, 'render')
          return render(h, context)
        }
      },
      {
        // 读转态且存在该组件的局部渲染函数
        match: (context: RenderContext, state: RWState, options: any = {}): boolean => {
          return this.isReadStateAndLocalRender(context, state, options, tag)
        },
        action: (h: CreateElement, context: RWState, options: any = {}): VNode | VNode[] => {
          const { namespace } = options
          const localConfig = _.get(context, `injections.${camelCase(namespace)}Provider.${camelCase(namespace)}Config`, {})
          const render = getRender(tag, localConfig)
          return render(h, context)
        }
      },
      {
        // 读转态且存在该组件的全局渲染函数
        match: (context: RenderContext, state: RWState, options: any = {}): boolean => {
          return this.isReadStateAndGlobalRender(context, state, options, tag)
        },
        action: (h: CreateElement, context: RenderContext, options: any = {}): VNode | VNode[] => {
          const render = getRender(tag, options)
          return render(h, context.data)
        }
      }
    ]
  }
}
