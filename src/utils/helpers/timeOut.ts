export const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> =>
    Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Operation timed out")), ms)
        )
    ]);
