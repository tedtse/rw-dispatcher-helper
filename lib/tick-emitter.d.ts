export declare class TickEmitter {
    private listening;
    private tickList;
    constructor();
    on(id: string, callback?: Function, once?: boolean): void;
    once(id: string, callback?: Function): void;
    off(id: string): void;
    listen(): void;
    next(): void;
}
