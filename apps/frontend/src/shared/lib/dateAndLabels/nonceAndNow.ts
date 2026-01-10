export const createNonce = (): string => {
    return crypto.randomUUID();
};

export const nowIso = (): string => {
    return new Date().toISOString();
};
