// eslint-disable-next-line @typescript-eslint/no-unused-vars
function noop(_value) {
    // intentionally empty
}
// Resolver:
export function resolveSetter(setter) {
    return setter ?? noop;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveAnyClick(fn) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (fn ?? ((..._args) => undefined));
}
