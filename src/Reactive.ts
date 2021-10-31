import { removeFromArray } from './util';

export interface ReactiveEvent<T> {
    oldValue?: T;
    currentReactive?: Reactive<T>;
    cancel(): void;
}
export type ReactiveUpdater<T> = (value: T, ev: ReactiveEvent<T>) => void;
export type ReactiveCondition<T> = (value: T, ev: ReactiveEvent<T>) => boolean;
export type Rule<T> = (...params: any[]) => T;
export type Unsubscriber = () => void;

export class Reactive<T> {
    protected __subscriptionList: Reactive<T>[] = [];
    protected __subscriberList: Reactive<T>[] = [];
    protected __onUpdateFunctions: ReactiveUpdater<T>[] = [];
    protected __onEqualsFunctions: Map<T, ReactiveUpdater<T>> = new Map();
    protected __bindingFunctions: ReactiveUpdater<T>[] = [];
    protected __allowDuplicate: boolean = false;
    protected __rule?: Rule<T>;
    protected __currentValue?: T;

    constructor(initial?: T | Rule<T>, ...subscriptions: Reactive<any>[]) {
        if (typeof initial === 'function') {
            this.setRule(initial as Rule<T>, ...subscriptions);
        } else {
            this.value = initial as T;
        }
    }
    protected __addSubscription(sub: Reactive<any>): void {
        this.__subscriptionList.push(sub);
        sub.__subscriberList.push(this);
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
    protected __getValueByRule(rule: Rule<T>): T {
        const params = this.__subscriptionList.map(sub => sub.value);
        return rule(...params);
    }
    protected __callUpdateFunctions(value?: T): void {
        const totalSubscriber = this.__subscriberList.length;
        const totalFunctions = this.__bindingFunctions.length
            + this.__onUpdateFunctions.length
            + this.__onEqualsFunctions.size;
        if (!(totalSubscriber + totalFunctions)) {
            if (value !== undefined) {
                this.__currentValue = value;
            }
            return;
        }
        const current = value !== undefined ? value : this.value;
        const changed = current !== this.__currentValue;
        if (this.__allowDuplicate || changed) {
            const oldValue = this.__currentValue;
            this.__currentValue = current;
            let reactionFlag = totalSubscriber > 0;
            if (totalFunctions) {
                let skip = false;
                const reactionEvent = {
                    oldValue,
                    currentReactive: this,
                    cancel: () => {
                        skip = true;
                        this.__currentValue = oldValue;
                    },
                };
                const equalFunction = this.__onEqualsFunctions.get(current);
                if (equalFunction) {
                    equalFunction(current, reactionEvent);
                    if (skip) {
                        return;
                    }
                }
                for (const updateFunction of this.__onUpdateFunctions) {
                    updateFunction(current, reactionEvent);
                    if (skip) {
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
        return this.__rule ? this.__getValueByRule(this.__rule) : this.__currentValue as T;
    }
    set value(value: T) {
        this.__clearSubscription();
        this.__rule = undefined;
        this.__callUpdateFunctions(value);
    }
    setRule(rule: Rule<T>, ...subscriptions: Reactive<any>[]) {
        this.__clearSubscription();
        subscriptions.forEach(sub => this.__addSubscription(sub));
        this.__rule = rule;
    }
    onChange(callback: ReactiveUpdater<T>, immediateCall: boolean = false): Unsubscriber {
        this.__onUpdateFunctions.push(callback);
        if (immediateCall) {
            callback(this.value, Reactive.createEmptyEvent(this));
        }
        return () => removeFromArray(callback, this.__onUpdateFunctions);
    }
    onEquals(compare: T, callback: ReactiveUpdater<T>): Unsubscriber {
        this.__onEqualsFunctions.set(compare, callback);
        if (this.value === compare) {
            callback(this.value, Reactive.createEmptyEvent(this));
        }
        return () => this.__onEqualsFunctions.delete(compare);
    }
    when(condition: ReactiveCondition<T>, callback: ReactiveUpdater<T>): Unsubscriber {
        return this.onChange(
            (value: T, ev: ReactiveEvent<T>) => condition(value, ev) && callback(value, ev),
            true
        );
    }
    bindValue(obj: any, param: string, decorator?: (value?: T) => any): Unsubscriber {
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
            cancel: () => { },
        };
    }
}
