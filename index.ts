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
export { Duck, DuckType, duck, quack } from "./src/duck";
export { DinoFunction, dino } from "./src/dino";

export default reactive;
