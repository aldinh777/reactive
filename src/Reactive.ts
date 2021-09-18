export interface ReactiveEvent<T> {
    oldValue: T;
    currentReactive: Reactive<T>;
    preventReaction: () => void;
    preventNext: (times?: number) => void;
    cancel: () => void;
}
export type ReactiveUpdater<T> = (current: T, ev: ReactiveEvent<T>) => void;
export type ReactiveValue<T> = T|(() => T);
export type Unsubscriber = () => void;

export class Reactive<T> {
    protected __subscriptionList: Reactive<T>[] = [];
    protected __subscriberList: Reactive<T>[] = [];
    protected __onUpdateFunctions: ReactiveUpdater<T>[] = [];
    protected __bindingFunctions: ReactiveUpdater<T>[] = [];
    protected __allowDuplicate: boolean = false;
    protected __getValue!: () => T;
    protected __oldValue!: () => T;

    constructor(initial?: ReactiveValue<T>) {
        if (typeof initial === 'function') {
            this.rule = initial as () => T;
        } else {
            this.value = initial as T;
        }
    }
    protected __addSubscriber(...subs: Reactive<any>[]) :void {
        this.__subscriberList.push(...subs);
    };
    protected __removeSubscriber(sub: Reactive<any>) :void {
        this.__subscriberList = this.__subscriberList.filter(subscriber => subscriber !== sub);
    };
    protected __callUpdateFunctions() :void {
        let reactionFlag = true;
        let skipAll = false;
        let skipTimes = 0;
        const reactionEvent = {
            oldValue: this.__oldValue(),
            currentReactive: this,
            preventReaction: () => reactionFlag = false,
            preventNext: (times: number = -1) => skipTimes = times,
            cancel: () => {
                this.__getValue = this.__oldValue;
                skipAll = true;
            }
        };
        for (const updateFunction of this.__onUpdateFunctions) {
            if (skipAll) {
                return;
            }
            if (skipTimes > 0) {
                skipTimes--;
                continue;
            }
            else if (skipTimes === -1) {
                break;
            }
            updateFunction(this.value, reactionEvent);
        }
        for (const bindingFunction of this.__bindingFunctions) {
            bindingFunction(this.value, reactionEvent);            
        }
        if (reactionFlag) {
            for (const subscriber of this.__subscriberList) {
                subscriber.__callUpdateFunctions();                
            }
        }
    }
    get value() :T {
        return this.__getValue();
    }
    set value(value: T) {
        this.__oldValue = this.__getValue ? this.__getValue : () => undefined!;
        if (!this.__allowDuplicate && this.__getValue && this.__oldValue() === value) {
            return;
        }
        this.rule = () => value;
    }
    set rule(rule: () => T) {
        this.__oldValue = this.__getValue ? this.__getValue : () => undefined!;
        this.__getValue = rule;
        this.__callUpdateFunctions();
    }
    onChange(callback: ReactiveUpdater<T>, immediateCall: boolean = false) :Unsubscriber {
        this.__onUpdateFunctions.push(callback);
        var reactionEvent = {
            oldValue: this.__oldValue(),
            currentReactive: this,
            preventReaction: () => {},
            preventNext: () => {},
            cancel: () => {
                this.__getValue = this.__oldValue;
            }
        };
        if (immediateCall) {
            callback(this.value, reactionEvent);
        }
        return () => {
            var index = this.__onUpdateFunctions.findIndex(function (c) { return c == callback; });
            if (index !== -1) {
                this.__onUpdateFunctions.splice(index, 1);
            }
        };
    }
    bindValue(obj: any, param: string, decorator?: (value: ReactiveValue<T>) => any) :Unsubscriber {
        const callback = (value: T) => obj[param] = decorator ? decorator(value) : value;
        callback(this.value);
        this.__bindingFunctions.push(callback);
        return () => {
            var index = this.__bindingFunctions.findIndex(c => c === callback);
            if (index !== -1) {
                this.__bindingFunctions.splice(index, 1);
            }
            return callback;
        };
    }
    bind(...subs: Reactive<any>[]) :Reactive<T> {
        for (const sub of this.__subscriptionList) {
            sub.__removeSubscriber(this);
        }
        this.__subscriptionList = subs;
        for (const sub of subs) {
            sub.__addSubscriber(this);
        }
        return this;
    }
    allowDuplicate(allow: boolean = true) :Reactive<T> {
        this.__allowDuplicate = allow;
        return this;
    }
}
