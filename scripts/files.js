import os from 'os';
import path from 'path';
export function toAbsolutePath(relativePath) {
    let isDir = false;
    if (relativePath.endsWith('/'))
        isDir = true;
    if (relativePath.startsWith('/'))
        return relativePath;
    if (relativePath == null || typeof relativePath !== 'string')
        throw Error('invalid relativePath');
    const homedir = os.homedir();
    return (path.resolve(relativePath.replace('~', homedir + '/')) +
        (isDir ? '/' : ''));
}
export function parsePath(path) {
    path = toAbsolutePath(path);
    const matches = path.match(/^(?<path>.*\/)(?<file>[^\/]*)$/);
    if (!matches || !('groups' in matches))
        throw new Error('Invalid path');
    return matches.groups;
}
//# sourceMappingURL=files.js.map