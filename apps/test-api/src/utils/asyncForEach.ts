export const asyncForEach = async <T>(array: T[], callback: (item: T, index: number, array: T[]) => Promise<void>): Promise<void> => {
    for (let i = 0; i < array.length; i++) {
        await callback(array[i], i, array);
    }
};