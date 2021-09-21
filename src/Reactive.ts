export interface ReactiveEvent<T> {
    oldValue?: T;
    currentReactive?: Reactive<T>;
    preventReaction: () => void;
    preventNext: (times?: number) => void;
    cancel: () => void;
}
export type ReactiveUpdater<T> = (value: T, ev: ReactiveEvent<T>) => void;
export type ConditionUpdater<T> = (value: T, ev: ReactiveEvent<T>) => boolean;
export type ReactiveValue<T> = T | (() => T);
export type Unsubscriber = () => void;

interface InternalObserver {
    unsubscribers: Unsubscriber[];
    updateFunction: ReactiveUpdater<any>;
}

export class Reactive<T> {
    protected __subscriptionList: Reactive<T>[] = [];
    protected __subscriberList: Reactive<T>[] = [];
    protected __onUpdateFunctions: ReactiveUpdater<T>[] = [];
    protected __bindingFunctions: ReactiveUpdater<T>[] = [];
    protected __allowDuplicate: boolean = false;
    protected __getValue?: () => T;
    protected __oldValue?: T;

    protected static __reactiveStack: Reactive<any>[] = [];
    protected static __observerStack: InternalObserver[] = [];
    protected static __activeGetVal: Reactive<any> | null = null;
    protected static __activeGetObs: Reactive<any> | null = null;
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
        Reactive.removeFromArray(sub, this.__subscriberList);
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
            this.__oldValue = initial;
            return;
        }
        const current = initial !== undefined ? initial
            : this.__getValue ? this.__getValue() : this.__oldValue as T;
        const changed = current !== this.__oldValue;
        if (this.__allowDuplicate || changed) {
            const oldValue = this.__oldValue;
            this.__oldValue = current;
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
                    updateFunction(current, reactionEvent);
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
            Reactive.getStackAndCompare(reStack, subList, sub => sub, sub => {
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
            Reactive.getStackAndCompare(obStack, updList, obs => obs.updateFunction, obs => {
                if (!Reactive.__activeGetObs) {
                    Reactive.__activeGetObs = this;
                    const { unsubscribers, updateFunction } = obs;
                    unsubscribers.push(this.onChange(updateFunction));
                }
            })
        }
        const value = initiationFlag ? this.__oldValue as T
            : this.__getValue ? this.__getValue() : this.__oldValue as T;
        if (Reactive.__hasReactiveStack) {
            if (Reactive.__activeGetVal === this) {
                Reactive.__activeGetVal = null;
            }
        }
        if (Reactive.__hasObserverStack) {
            if (Reactive.__activeGetObs === this) {
                Reactive.__activeGetObs = null;
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
        Reactive.pushStackAndPop(Reactive.__reactiveStack, this, rule, initial => {
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
        return () => Reactive.removeFromArray(callback, this.__onUpdateFunctions);
    }
    bindValue(obj: any, param: string, decorator?: (value?: ReactiveValue<T>) => any): Unsubscriber {
        const callback = (value?: T) => obj[param] = decorator ? decorator(value) : value;
        callback(this.value);
        this.__bindingFunctions.push(callback);
        return () => Reactive.removeFromArray(callback, this.__bindingFunctions);
    }
    allowDuplicate(allow: boolean = true): Reactive<T> {
        this.__allowDuplicate = allow;
        return this;
    }
    static observe(updateFunction: ReactiveUpdater<any>): Unsubscriber {
        const observer: InternalObserver = { unsubscribers: [], updateFunction };
        const fetcher = () => updateFunction(undefined, Reactive.createEmptyEvent());
        Reactive.__hasObserverStack = true;
        Reactive.pushStackAndPop(Reactive.__observerStack, observer, fetcher, _ => {
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
        Reactive.pushStackAndPop(Reactive.__observerStack, observer, fetcher, yes => {
            if (!Reactive.__observerStack.length) {
                Reactive.__hasObserverStack = false;
            }
            if (yes) {
                callback(undefined, Reactive.createEmptyEvent());
            }
        });
        return () => observer && observer.unsubscribers.forEach(unsub => unsub());
    }
    private static createEmptyEvent(re?: Reactive<any>): ReactiveEvent<any> {
        return {
            oldValue: re ? re.__oldValue : undefined,
            currentReactive: re,
            preventReaction: () => { },
            preventNext: () => { },
            cancel: () => { },
        };
    }
    private static removeFromArray<T>(elem: T, array: T[]): void {
        const index = array.indexOf(elem);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }
    private static getStackAndCompare<U, V>(
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
    private static pushStackAndPop<U, V>(
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
}
