import { TLifeCycle, ELifeCycle, CodeOptions } from './type';
declare class LifeCycle {
    lifeCycle: TLifeCycle | undefined;
    loopLifeCycle(): void;
    init(options: CodeOptions): void;
    getLiftCycle(lifeCycleName: `${ELifeCycle}`): (() => void) | undefined;
    runLifeCycle(lifeCycleName: `${ELifeCycle}`): void;
}
declare const _default: LifeCycle;
export default _default;
