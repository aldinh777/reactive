import { reactive } from "./src/helper";

export {
    Reactive,
    ReactiveEvent,
    ReactiveUpdater,
    ReactiveCondition,
    Rule,
    Unsubscriber
} from "./src/Reactive";
export {
    reactive,
    onChange,
    when,
    update,
    increase,
    decrease
} from "./src/helper";
export { Duck, DuckType, duck, duckFrom } from "./src/Duck";
export { Reduck, ReduckType, ReduckListener, reduck, reduckFrom } from "./src/Reduck";
export { DinoFunction, dino } from "./src/dino";

export default reactive;
