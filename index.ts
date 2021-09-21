import { reactive } from "./src/reactiveHelper";

export {
    Reactive,
    ReactiveEvent,
    ReactiveUpdater,
    ConditionUpdater,
    ReactiveValue,
    Unsubscriber
} from "./src/Reactive";
export {
    reactive,
    onChange,
    observe,
    when,
    update,
    increase,
    decrease
} from "./src/reactiveHelper";
export { Duck, DuckType, Maybe, quack } from "./src/Duck";
export { DinoFunction, dino } from "./src/dino";

export default reactive;
