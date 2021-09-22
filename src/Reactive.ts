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

interface InternalObserver {
    unsubscribers: Unsubscriber[];
    updateFunction: ReactiveUpdater<any>;
}

function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

function getStackAndCompare<U, V>(
    stackArray: U[],
    targetList: V[],
    mapper: (value: U) => V,
    callback: (value: U) => void
): void {
    if (stackArray.length) {
        const result = stackArray[stackArray.length - 1];
        const compare = mapper(result);
        if (!targetList.includes(compare)) {
            callback(result);
        }
    }
}

function pushStackAndPop<U, V>(
    stackArray: U[],
    item: U,
    fetcher: () => V,
    callback?: (result: V) => void
): void {
    stackArray.push(item);
    const result = fetcher();
    stackArray.pop();
    if (callback) {
        callback(result);
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

    protected static __reactiveStack: Reactive<any>[] = [];
    protected static __observerStack: InternalObserver[] = [];
    protected static __activeGetVal: Reactive<any> | null = null;
    protected static __hasReactiveStack: boolean = false;
    protected static __hasObserverStack: boolean = false;

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
        if (Reactive.__hasReactiveStack) {
            const reStack = Reactive.__reactiveStack;
            const subList = this.__subscriberList;
            getStackAndCompare(reStack, subList, sub => sub, sub => {
                if (!Reactive.__activeGetVal) {
                    initiationFlag = true;
                    Reactive.__activeGetVal = this;
                }
                sub.__addSubscription(this);
            });
        }
        if (Reactive.__hasObserverStack) {
            const obStack = Reactive.__observerStack;
            const updList = this.__onUpdateFunctions;
            getStackAndCompare(obStack, updList, obs => obs.updateFunction, obs => {
                const { unsubscribers, updateFunction } = obs;
                unsubscribers.push(this.onChange(updateFunction));
            })
        }
        const value = initiationFlag ? this.__currentValue as T
            : this.__getValue ? this.__getValue() : this.__currentValue as T;
        if (Reactive.__hasReactiveStack) {
            if (Reactive.__activeGetVal === this) {
                Reactive.__activeGetVal = null;
            }
        }
        return value;
    }
    set value(value: T) {
        this.__clearSubscription();
        this.__getValue = undefined;
        this.__callUpdateFunctions(value);
    }
    set rule(rule: () => T) {
        this.__clearSubscription();
        Reactive.__hasReactiveStack = true;
        pushStackAndPop(Reactive.__reactiveStack, this, rule, initial => {
            if (!Reactive.__reactiveStack.length) {
                Reactive.__hasReactiveStack = false;
            }
            this.__getValue = rule;
            this.__callUpdateFunctions(initial);
        });
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
    static observe(updateFunction: ReactiveUpdater<any>): Unsubscriber {
        const observer: InternalObserver = { unsubscribers: [], updateFunction };
        const fetcher = () => updateFunction(undefined, Reactive.createEmptyEvent());
        Reactive.__hasObserverStack = true;
        pushStackAndPop(Reactive.__observerStack, observer, fetcher, () => {
            if (!Reactive.__observerStack.length) {
                Reactive.__hasObserverStack = false;
            }
        });
        return () => observer && observer.unsubscribers.forEach(unsub => unsub());
    }
    static observeIf(condition: ConditionUpdater<any>, callback: ReactiveUpdater<any>): Unsubscriber {
        const updateFunction: ReactiveUpdater<any> = (value, ev) => condition(value, ev) && callback(value, ev);
        const fetcher = () => condition(undefined, Reactive.createEmptyEvent());
        const observer: InternalObserver = { unsubscribers: [], updateFunction };
        Reactive.__hasObserverStack = true;
        pushStackAndPop(Reactive.__observerStack, observer, fetcher, yes => {
            if (!Reactive.__observerStack.length) {
                Reactive.__hasObserverStack = false;
            }
            if (yes) {
                callback(undefined, Reactive.createEmptyEvent());
            }
        });
        return () => observer && observer.unsubscribers.forEach(unsub => unsub());
    }
}
