import Vue from 'vue'
import _ from 'lodash'

interface TickerItem {
  id: string,
  callback: Function,
  once?: boolean
}

export class TickEmitter {
  private listening: boolean
  private tickList: TickerItem[]

  constructor () {
    this.listening = false
    this.tickList = []
  }
  on (id: string, callback: Function = _.noop, once: boolean = false) {
    this.listen()
    this.tickList.push({
      id,
      callback,
      once
    })
  }
  once (id: string, callback: Function = _.noop) {
    this.on(id, callback, true)
  }
  off (id: string) {
    this.tickList = this.tickList.filter(item => item.id !== id)
  }
  listen () {
    if (this.listening) {
      return
    }
    this.listening = true
    this.next()
  }
  next () {
    if (!this.listening) {
      return
    }
    Vue.nextTick()
      .then(() => {
        this.tickList.forEach(item => {
          item.callback()
          if (item.once) {
            this.off(item.id)
          }
        })
        if (!this.tickList.length) {
          this.listening = false
        }
        // return this.next()
      })
  }
}
