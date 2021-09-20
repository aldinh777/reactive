export interface ReactiveEvent<T> {
    oldValue?: T;
    currentReactive: Reactive<T>;
    preventReaction: () => void;
    preventNext: (times?: number) => void;
    cancel: () => void;
}
export type ReactiveUpdater<T> = (current: T, ev: ReactiveEvent<T>) => void;
export type ReactiveValue<T> = T | (() => T);
export type Unsubscriber = () => void;

export class Reactive<T> {
    protected __subscriptionList: Reactive<T>[] = [];
    protected __subscriberList: Reactive<T>[] = [];
    protected __onUpdateFunctions: ReactiveUpdater<T>[] = [];
    protected __bindingFunctions: ReactiveUpdater<T>[] = [];
    protected __allowDuplicate: boolean = false;
    protected __getValue!: () => T;
    protected __oldValue?: T;

    protected static __reactiveStack: Reactive<any>[] = [];
    protected static __observerStack: ReactiveEvent<any>[] = [];
    protected static __activeGetVal: Reactive<any>|null = null;

    constructor(initial?: ReactiveValue<T>) {
        if (typeof initial === 'function') {
            this.rule = initial as () => T;
        } else {
            this.value = initial as T;
        }
    }
    protected __addSubscription(sub: Reactive<any>): void {
        this.__subscriptionList.push(sub);
        sub.__subscriberList.push(this);
    }
    protected __removeSubsriber(sub: Reactive<any>): void {
        const index = this.__subscriberList.indexOf(sub);
        if (index !== -1) {
            this.__subscriberList.splice(index, 1);
        }
    }
    protected __clearSubscription(): void {
        for (const sub of this.__subscriptionList) {
            sub.__removeSubsriber(this);
        }
        this.__subscriptionList = [];
    }
    protected __callUpdateFunctions(): void {
        let reactionFlag = true;
        let skipAll = false;
        let skipTimes = 0;
        const reactionEvent = {
            oldValue: this.__oldValue,
            currentReactive: this,
            preventReaction: () => reactionFlag = false,
            preventNext: (times: number = -1) => skipTimes = times,
            cancel: () => skipAll = true,
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
    get value(): T {
        if (!Reactive.__activeGetVal) {
            Reactive.__activeGetVal = this;
            if (Reactive.__reactiveStack.length > 0) {
                const sub = Reactive.__reactiveStack[Reactive.__reactiveStack.length - 1];
                if (!this.__subscriberList.includes(sub)) {
                    sub.__addSubscription(this);
                }
            }
        }
        const value = this.__getValue();
        if (Reactive.__activeGetVal === this) {
            Reactive.__activeGetVal = null;
        }
        return value;
    }
    set value(value: T) {
        this.rule = () => value;
    }
    set rule(rule: () => T) {
        this.__clearSubscription();
        Reactive.__reactiveStack.push(this);
        const newValue = rule();
        Reactive.__reactiveStack.pop();
        this.__getValue = rule;
        // this.__callUpdateFunctions();
    }
    onChange(callback: ReactiveUpdater<T>, immediateCall: boolean = false): Unsubscriber {
        this.__onUpdateFunctions.push(callback);
        const reactionEvent = {
            oldValue: this.__oldValue,
            currentReactive: this,
            preventReaction: () => { },
            preventNext: () => { },
            cancel: () => { },
        };
        if (immediateCall) {
            callback(this.value, reactionEvent);
        }
        return () => {
            const index = this.__onUpdateFunctions.findIndex(function (c) { return c == callback; });
            if (index !== -1) {
                this.__onUpdateFunctions.splice(index, 1);
            }
        };
    }
    bindValue(obj: any, param: string, decorator?: (value: ReactiveValue<T>) => any): Unsubscriber {
        const callback = (value: T) => obj[param] = decorator ? decorator(value) : value;
        callback(this.value);
        this.__bindingFunctions.push(callback);
        return () => {
            const index = this.__bindingFunctions.findIndex(c => c === callback);
            if (index !== -1) {
                this.__bindingFunctions.splice(index, 1);
            }
            return callback;
        };
    }
    allowDuplicate(allow: boolean = true): Reactive<T> {
        this.__allowDuplicate = allow;
        return this;
    }
}
