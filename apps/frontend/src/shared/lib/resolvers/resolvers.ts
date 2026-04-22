type Setter<T> = (value: T) => void;

 
function noop<T>(_value: T): void {
    // intentionally empty
}

// Resolver:
export function resolveSetter<T>(setter?: Setter<T>): Setter<T> {
    return setter ?? noop;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveAnyClick<F extends (...args: any[]) => any>(fn?: F): F {
     
    return (fn ?? ((..._args: Parameters<F>) => undefined)) as F;
}
