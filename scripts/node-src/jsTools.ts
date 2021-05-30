export function makeSync<T, A extends Array<unknown>>(
    asyncFunc: (...args: A) => Promise<T>,
    args: A
): T {
    let sync = true;
    let returnVal: T = null;

    asyncFunc(...args).then(res => {
        returnVal = res;
        sync = false;
    });

    while (sync) {}

    return returnVal;
}
