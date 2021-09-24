import { reactive } from "./src/helper";

export {
    Reactive,
    ReactiveEvent,
    ReactiveUpdater,
    ConditionUpdater,
    ReactiveValue,
    Unsubscriber
} from "./src/reactive";
export {
    reactive,
    onChange,
    when,
    update,
    increase,
    decrease
} from "./src/helper";
export { Duck, DuckType, duck, quack } from "./src/duck";
export { DinoFunction, dino } from "./src/dino";

export default reactive;
