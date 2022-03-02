export function makeSync(asyncFunc, args) {
    let sync = true;
    let returnVal = null;
    asyncFunc(...args).then(res => {
        returnVal = res;
        sync = false;
    });
    while (sync) { }
    return returnVal;
}
