"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StateList_1 = require("../../collection/StateList");
function statelist(list) {
    return new Proxy(new StateList_1.StateList(list), {
        get: function (target, p, receiver) {
            if (typeof p === 'string') {
                var index = parseInt(p);
                if (Number.isInteger(index)) {
                    return target.get(index);
                }
            }
            return Reflect.get(target, p, receiver);
        },
        set: function (target, p, value, receiver) {
            if (typeof p === 'string') {
                var index = parseInt(p);
                if (Number.isInteger(index)) {
                    target.set(index, value);
                    return true;
                }
            }
            return Reflect.set(target, p, value, receiver);
        }
    });
}
exports.statelist = statelist;
