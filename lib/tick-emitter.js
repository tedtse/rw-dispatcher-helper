import Vue from 'vue';
import _ from 'lodash';
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
export { TickEmitter };
