export interface ReactiveEvent<T> {
    oldValue?: T;
    currentReactive?: Reactive<T>;
    preventReaction(): void;
    preventNext(times?: number): void;
    cancel(): void;
}
export type ReactiveUpdater<T> = (value: T, ev: ReactiveEvent<T>) => void;
export type ConditionUpdater<T> = (value: T, ev: ReactiveEvent<T>) => boolean;
export type ReactiveValue<T> = T | (() => T);
export type Unsubscriber = () => void;


function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export class Reactive<T> {
    protected __subscriptionList: Reactive<T>[] = [];
    protected __subscriberList: Reactive<T>[] = [];
    protected __onUpdateFunctions: ReactiveUpdater<T>[] = [];
    protected __bindingFunctions: ReactiveUpdater<T>[] = [];
    protected __allowDuplicate: boolean = false;
    protected __getValue?: () => T;
    protected __currentValue?: T;

    constructor(initial?: ReactiveValue<T>) {
        if (typeof initial === 'function') {
            this.rule = initial as () => T;
        } else {
            this.value = initial as T;
        }
    }
    protected __addSubscription(sub: Reactive<any>): void {
        if (sub !== this) {
            this.__subscriptionList.push(sub);
            sub.__subscriberList.push(this);
        }
    }
    protected __removeSubsriber(sub: Reactive<any>): void {
        removeFromArray(sub, this.__subscriberList);
    }
    protected __clearSubscription(): void {
        for (const sub of this.__subscriptionList) {
            sub.__removeSubsriber(this);
        }
        this.__subscriptionList = [];
    }
    protected __callUpdateFunctions(initial?: T): void {
        const totalSubscriber = this.__subscriberList.length;
        const totalFunctions = this.__bindingFunctions.length + this.__onUpdateFunctions.length;
        if (!(totalSubscriber + totalFunctions)) {
            this.__currentValue = initial;
            return;
        }
        const current = initial !== undefined ? initial
            : this.__getValue ? this.__getValue() : this.__currentValue as T;
        const changed = current !== this.__currentValue;
        if (this.__allowDuplicate || changed) {
            const oldValue = this.__currentValue;
            this.__currentValue = current;
            let reactionFlag = totalSubscriber > 0;
            if (totalFunctions) {
                let skipAll = false;
                let skipTimes = 0;
                const reactionEvent = {
                    oldValue,
                    currentReactive: this,
                    preventReaction: () => reactionFlag = false,
                    preventNext: (times: number = -1) => skipTimes = times,
                    cancel: () => skipAll = true,
                };
                for (const updateFunction of this.__onUpdateFunctions) {
                    if (skipTimes > 0) {
                        skipTimes--;
                        continue;
                    }
                    else if (skipTimes === -1) {
                        break;
                    }
                    updateFunction(current, reactionEvent);
                    if (skipAll) {
                        return;
                    }
                }
                this.__bindingFunctions.forEach(bind => bind(current, reactionEvent));
            }
            if (reactionFlag) {
                this.__subscriberList.forEach(sub => sub.__callUpdateFunctions())
            }
        }
    }
    get value(): T {
        let initiationFlag = false;
        const value = initiationFlag ? this.__currentValue as T
            : this.__getValue ? this.__getValue() : this.__currentValue as T;
        return value;
    }
    set value(value: T) {
        this.__clearSubscription();
        this.__getValue = undefined;
        this.__callUpdateFunctions(value);
    }
    set rule(rule: () => T) {
        this.__clearSubscription();
        this.__getValue = rule;
        this.__callUpdateFunctions(rule());
    }
    onChange(callback: ReactiveUpdater<T>, immediateCall: boolean = false): Unsubscriber {
        this.__onUpdateFunctions.push(callback);
        if (immediateCall) {
            callback(this.value, Reactive.createEmptyEvent(this));
        }
        return () => removeFromArray(callback, this.__onUpdateFunctions);
    }
    bind(...subscriptions: Reactive<any>[]): Reactive<T> {
        this.__clearSubscription();
        for (const subscription of subscriptions) {
            this.__addSubscription(subscription);
        }
        return this;
    }
    bindValue(obj: any, param: string, decorator?: (value?: ReactiveValue<T>) => any): Unsubscriber {
        const callback = (value?: T) => obj[param] = decorator ? decorator(value) : value;
        callback(this.value);
        this.__bindingFunctions.push(callback);
        return () => removeFromArray(callback, this.__bindingFunctions);
    }
    allowDuplicate(allow: boolean = true): Reactive<T> {
        this.__allowDuplicate = allow;
        return this;
    }
    static createEmptyEvent(re?: Reactive<any>): ReactiveEvent<any> {
        return {
            oldValue: re ? re.__currentValue : undefined,
            currentReactive: re,
            preventReaction: () => { },
            preventNext: () => { },
            cancel: () => { },
        };
    }    
}
