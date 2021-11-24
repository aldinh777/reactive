import { removeFromArray } from './util';

export type ReactiveUpdater<T> = (value: T, ev: ReactiveEvent<T>) => void;
export type ReactiveCondition<T> = (value: T, ev: ReactiveEvent<T>) => boolean;
export type Rule<T> = (...params: any[]) => T;
export type Unsubscriber = () => void;
export interface ReactiveEvent<T> {
    oldValue?: T;
    currentReactive?: Reactive<T>;
    cancel(): void;
}

export class Reactive<T> {
    private __subscriptionList: Reactive<any>[] = [];
    private __subscriberSet: Set<Reactive<any>> = new Set();
    private __onUpdateFunctions: ReactiveUpdater<T>[] = [];
    private __onEqualsFunctions: Map<T, ReactiveUpdater<T>> = new Map();
    private __bindingFunctions: Set<ReactiveUpdater<T>> = new Set();
    private __allowDuplicate: boolean = false;
    private __rule?: Rule<T>;
    private __currentValue?: T;

    constructor(initial?: T | Rule<T>, ...subscriptions: Reactive<any>[]) {
        if (typeof initial === 'function') {
            this.setRule(initial as Rule<T>, ...subscriptions);
        } else {
            this.value = initial as T;
        }
    }
    private __addSubscription(sub: Reactive<any>): void {
        this.__subscriptionList.push(sub);
        sub.__subscriberSet.add(this);
    }
    private __clearSubscription(): void {
        this.__subscriptionList.forEach(sub => sub.__subscriberSet.delete(this));
        this.__subscriptionList.splice(0, this.__subscriptionList.length);
    }
    private __triggerUpdate(value?: T): void {
        const totalSubscriber = this.__subscriberSet.size;
        const totalFunctions = this.__bindingFunctions.size +
            this.__onUpdateFunctions.length + this.__onEqualsFunctions.size;
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
            if (totalSubscriber) {
                this.__subscriberSet.forEach(sub => sub.__triggerUpdate())
            }
        }
    }
    get value(): T {
        return this.__rule ? this.__rule(this.__subscriptionList.map(sub => sub.value)) : this.__currentValue as T;
    }
    set value(value: T) {
        this.__clearSubscription();
        this.__rule = undefined;
        this.__triggerUpdate(value);
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
        this.__bindingFunctions.add(callback);
        return () => this.__bindingFunctions.delete(callback);
    }
    allowDuplicate(allow: boolean = true): this {
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
