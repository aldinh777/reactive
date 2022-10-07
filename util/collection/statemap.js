"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StateMap_1 = require("../../collection/StateMap");
function statemap(map) {
    return new Proxy(new StateMap_1.StateMap(map), {
        get: function (target, p, receiver) {
            if (!Reflect.has(target, p)) {
                if (typeof p === 'string') {
                    return target.get(p);
                }
            }
            return Reflect.get(target, p, receiver);
        },
        set: function (target, p, value, receiver) {
            if (!Reflect.has(target, p)) {
                if (typeof p === 'string') {
                    target.set(p, value);
                    return true;
                }
            }
            return Reflect.set(target, p, value, receiver);
        }
    });
}
exports.statemap = statemap;
