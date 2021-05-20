#!/bin/node

if (process.argv.length <= 2) {
    console.error(`USAGE = parse_json.sh '<json_string>' (<format>)\n`);
    console.error(
        `\tFormat Should look something like: 'My IP is %(|ip) and my location is %(|location|0|city)'`
    );
    console.error(
        `\tIf a format is not recognized or is not a leaf node, nothing will be inserted`
    );
    process.exit(1);
}

function displayObj(obj: any, str = '') {
    if (Array.isArray(obj)) {
        console.log(str + '|#: ' + obj.length);
        obj.forEach((sub, idx) => {
            displayObj(sub, str + '|' + idx);
        });
    } else if (obj instanceof Object) {
        for (const key of Object.keys(obj)) {
            const kid = obj[key];
            displayObj(kid, str + '|' + key);
        }
    } else {
        console.log(str.replace(/\s/g, '_') + ': ' + obj);
    }
}

function parseFormat(format: string, obj: any) {
    return format.replace(/%\(.*?\)/g, match => {
        const stack = match
            .replace(/^%\(|\)$/g, '')
            .split('|')
            .filter(v => !!v);
        let ref = obj;
        while (stack.length) {
            try {
                const prop = stack.shift();
                if (prop === '#') {
                    if (Array.isArray(ref)) {
                        return ref.length;
                    } else if (ref instanceof Object) {
                        return Object.keys(ref).length;
                    } else {
                        return '';
                    }
                }

                ref = ref[prop];
            } catch (err) {
                return '';
            }
        }
        if (Array.isArray(ref) || ref instanceof Object || ref === undefined)
            return '';

        return ref;
    });
}

try {
    const obj = JSON.parse(process.argv[2]);
    if (process.argv.length > 3) console.log(parseFormat(process.argv[3], obj));
    else displayObj(obj);
} catch (err) {
    console.error('Could not parse JSON' + err);
}
