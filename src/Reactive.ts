import { Cancelable, Subscription } from './interface';
import { removeFromArray } from './util';

export type ReactiveUpdater<T> = (value: T, ev: ReactiveEvent<T>) => void;
export type ReactiveCondition<T> = (value: T, ev: ReactiveEvent<T>) => boolean;
export type Rule<T> = (...params: any[]) => T;
export interface ReactiveEvent<T> extends Cancelable {
    oldValue?: T;
    currentReactive?: Reactive<T>;
}
export interface ReactiveSubscription<T> extends Subscription {
    reactive: Reactive<T>;
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
        if (this.__subscriptionList.length > 0) {
            this.__subscriptionList.forEach(sub => sub.__subscriberSet.delete(this));
            this.__subscriptionList.splice(0, this.__subscriptionList.length);
        }
    }
    private __triggerUpdate(nextValue: T): void {
        const totalSubscriber = this.__subscriberSet.size;
        const totalFunctions = this.__bindingFunctions.size
            + this.__onUpdateFunctions.length
            + this.__onEqualsFunctions.size;
        if (totalSubscriber + totalFunctions == 0) {
            this.__currentValue = nextValue;
        } else if (this.__allowDuplicate || nextValue !== this.__currentValue) {
            const oldValue = this.__currentValue;
            this.__currentValue = nextValue;
            let skip = false;
            const reactionEvent = {
                oldValue,
                currentReactive: this,
                cancel: () => {
                    skip = true;
                    this.__currentValue = oldValue;
                },
            };
            if (totalFunctions > 0) {
                const equalFunction = this.__onEqualsFunctions.get(this.__currentValue);
                if (equalFunction) {
                    equalFunction(this.__currentValue, reactionEvent);
                    if (skip) {
                        return;
                    }
                }
                for (const updateFunction of this.__onUpdateFunctions) {
                    updateFunction(this.__currentValue, reactionEvent);
                    if (skip) {
                        return;
                    }
                }
                this.__bindingFunctions.forEach(bind => bind(this.__currentValue as T, reactionEvent));
            }
            if (totalSubscriber > 0) {
                this.__subscriberSet.forEach(sub => sub.__triggerUpdate(sub.value));
            }
        }
    }
    get value(): T {
        return this.__rule ?
            this.__rule(...this.__subscriptionList.map(sub => sub.value)) :
            this.__currentValue as T;
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
    onChange(callback: ReactiveUpdater<T>, immediateCall: boolean = false): ReactiveSubscription<T> {
        this.__onUpdateFunctions.push(callback);
        if (immediateCall) {
            callback(this.value, Reactive.createEmptyEvent(this));
        }
        return {
            reactive: this,
            unsubscribe: () => removeFromArray(callback, this.__onUpdateFunctions),
        };
    }
    onEquals(compare: T, callback: ReactiveUpdater<T>): ReactiveSubscription<T> {
        this.__onEqualsFunctions.set(compare, callback);
        if (this.value === compare) {
            callback(this.value, Reactive.createEmptyEvent(this));
        }
        return {
            reactive: this,
            unsubscribe: () => this.__onEqualsFunctions.delete(compare),
        };
    }
    when(condition: ReactiveCondition<T>, callback: ReactiveUpdater<T>): ReactiveSubscription<T> {
        return this.onChange(
            (value: T, ev: ReactiveEvent<T>) => condition(value, ev) && callback(value, ev),
            true
        );
    }
    bindValue(obj: any, param: string, decorator?: (value?: T) => any): ReactiveSubscription<T> {
        const callback = (value?: T) => obj[param] = decorator ? decorator(value) : value;
        callback(this.value);
        this.__bindingFunctions.add(callback);
        return {
            reactive: this,
            unsubscribe: () => this.__bindingFunctions.delete(callback),
        };
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
