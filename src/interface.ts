export interface Cancelable {
    cancel(): void;
}

export interface Subscription {
    unsubscribe(): void;
}