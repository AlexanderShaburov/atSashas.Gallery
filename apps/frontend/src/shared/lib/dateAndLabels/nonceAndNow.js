export const createNonce = () => {
    return crypto.randomUUID();
};
export const nowIso = () => {
    return new Date().toISOString();
};
