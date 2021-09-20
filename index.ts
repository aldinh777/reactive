import { reactive } from "./src/reactiveHelper";

export {
    Reactive,
    ReactiveEvent,
    ReactiveUpdater,
    ReactiveValue,
    Unsubscriber,
} from "./src/Reactive";
export {
    reactive,
    onChange,
    observe,
    when,
    update,
    increase,
    decrease,
    asyncWhen,
    asyncIncrease,
    asyncDecrease,
} from "./src/reactiveHelper";
export { Duck, DuckType, Maybe, quack } from "./src/Duck";
export { DinoFunction, SpinoFunction, dino, spino } from "./src/dino";

export default reactive;
