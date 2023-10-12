#!/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { cmd } from './shell.js';
import path from 'path';
import fs from 'fs';
import kl from 'kleur';
class FileExplorer {
    findFileInParentDirs(fileName, basePath) {
        let rootpath = path.resolve(basePath);
        while (rootpath !== '/' &&
            !fs.existsSync(path.join(rootpath, fileName)))
            rootpath = path.dirname(rootpath);
        if (rootpath === '/') {
            console.log(`Could not find the ${fileName} file...`);
            process.exit(1);
        }
        return path.join(rootpath, fileName);
    }
    getFileContent(path) {
        return fs
            .readFileSync(path, 'utf8')
            .replace(/\n\s*\/\/.*?(?=\n)/g, '')
            .replace(/}[\s\n]*$/g, '};')
            .replace(/\nimport\b/g, ';import')
            .replace(/\nexport\b/g, ';export')
            .replace(/\n/g, '');
    }
    /**
     * Makes sure that a path exists.
     * The path can omit the file extension.
     */
    verifyPathExists(packagePath) {
        try {
            if (fs.lstatSync(packagePath).isFile())
                return packagePath;
        }
        catch (_) { }
        try {
            let indexPath = path.join(packagePath, 'index.ts');
            if (fs.existsSync(indexPath)) {
                return indexPath;
            }
            indexPath = path.join(packagePath, 'index.js');
            if (fs.existsSync(indexPath)) {
                return indexPath;
            }
            if (fs.existsSync(packagePath + '.ts'))
                return packagePath + '.ts';
            if (fs.existsSync(packagePath + '.tsx'))
                return packagePath + '.tsx';
            if (fs.existsSync(packagePath + '.js'))
                return packagePath + '.js';
            if (fs.existsSync(packagePath + '.jsx'))
                return packagePath + '.jsx';
        }
        catch (err) { }
        return null;
    }
    getAllTsFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield cmd('fd "\\.ts$"');
            return res.split('\n');
        });
    }
}
class TsRuntime {
    constructor(filePath) {
        var _a;
        this.aliases = new Map();
        this.tsconfigPath = '';
        this.packageJsonPath = '';
        this.basePath = '';
        this.nodeModulesPath = '';
        this.explorer = new FileExplorer();
        this.tsconfigPath = this.explorer.findFileInParentDirs('tsconfig.json', filePath);
        this.packageJsonPath = this.explorer.findFileInParentDirs('package.json', filePath);
        this.nodeModulesPath = path.join(path.dirname(this.packageJsonPath), 'node_modules');
        const tsconfigJson = JSON.parse(fs.readFileSync(this.tsconfigPath, 'utf8'));
        const baseUrl = tsconfigJson['compilerOptions']['baseUrl'] || '.';
        this.basePath = path.join(path.dirname(this.tsconfigPath), baseUrl);
        const aliases = (_a = tsconfigJson['compilerOptions']) === null || _a === void 0 ? void 0 : _a['paths'];
        if (!aliases)
            return;
        for (const key of Object.keys(aliases)) {
            let alias = key;
            if (alias.endsWith('*'))
                alias = alias.slice(0, -1);
            let destination = aliases[key][0];
            if (destination.endsWith('*'))
                destination = destination.slice(0, -1);
            this.aliases.set(alias, destination);
        }
    }
    takeAliasOff(moduleName) {
        for (const [alias, destination] of this.aliases) {
            if (!alias.endsWith('/')) {
                if (alias === moduleName) {
                    // Cases where the alias refers to an exact file
                    return destination;
                }
                else {
                    continue;
                }
            }
            if (!alias)
                continue;
            if (moduleName.startsWith(alias)) {
                return moduleName.replace(alias, destination);
            }
        }
        return null;
    }
    createModuleName(filePath, modulePath) {
        if (modulePath.endsWith('/index.ts'))
            modulePath = modulePath.slice(0, -'/index.ts'.length);
        if (modulePath.endsWith('.ts'))
            modulePath = modulePath.slice(0, -'.ts'.length);
        const baseRelativePath = path.relative(this.basePath, modulePath);
        for (const [alias, destination] of this.aliases) {
            if (!destination.endsWith('/')) {
                if (destination === baseRelativePath) {
                    // Cases where the alias refers to an exact file
                    return alias;
                }
                else {
                    continue;
                }
            }
            if (baseRelativePath.startsWith(destination)) {
                return baseRelativePath.replace(destination, alias);
            }
        }
        return path.relative(filePath, modulePath);
    }
}
class DependencyHandler {
    constructor(explorer = new FileExplorer()) {
        this.explorer = explorer;
    }
    resolvePackageModuleName(packageName, filePath) {
        const runtime = new TsRuntime(filePath);
        const moduleDirPath = path.join(runtime.nodeModulesPath, packageName);
        const modulefilePath = this.explorer.verifyPathExists(moduleDirPath);
        if (modulefilePath) {
            // We're pointing directly to a file.
            return modulefilePath;
        }
        if (!fs.existsSync(moduleDirPath)) {
            throw new Error(`${filePath}\nCan't find package '${packageName}' in node_modules...`);
        }
        const modulePackageJsonPath = path.join(moduleDirPath, 'package.json');
        const modulePackageJson = JSON.parse(fs.readFileSync(modulePackageJsonPath, 'utf8'));
        const moduleMainFile = modulePackageJson['main'];
        const moduleMainFilePath = path.join(moduleDirPath, moduleMainFile);
        const actualFile = this.explorer.verifyPathExists(moduleMainFilePath);
        if (!actualFile) {
            throw new Error(`Could not resolve the npm dependency '${packageName}'`);
        }
        return actualFile;
    }
    resolveModuleName(packageName, filePath) {
        if (['fs', 'path', 'http'].includes(packageName) ||
            packageName.endsWith('.json')) {
            return '';
        }
        const runtime = new TsRuntime(filePath);
        const newPackageName = runtime.takeAliasOff(packageName);
        if (!!newPackageName) {
            // It was an alias
            packageName = newPackageName;
        }
        if (packageName.startsWith('.')) {
            // It's a relative path. Can be from the file itself or from tsconfig basepath
            let packagePath = path.join(path.dirname(filePath), packageName);
            let fullPath = this.explorer.verifyPathExists(packagePath);
            if (fullPath)
                return fullPath;
            packagePath = path.join(runtime.basePath, packageName);
            fullPath = this.explorer.verifyPathExists(packagePath);
            if (fullPath)
                return fullPath;
            throw new Error(`Could not resolve relative package '${packageName}' in file '${filePath}'`);
        }
        else {
            const basePathPath = this.explorer.verifyPathExists(path.join(runtime.basePath, packageName));
            if (basePathPath)
                return basePathPath;
            return this.resolvePackageModuleName(packageName, filePath);
        }
    }
    /**
     * '{ Day, DayHelper, Night, NightHelper as NH }'
     *   => ['Day', 'DayHelper', 'Night', 'NH']
     */
    parseCurvBracesModuleList(raw, mode) {
        const modules = raw
            .slice(1, -1)
            .split(',')
            .map(mod => {
            mod = mod.trim();
            if (mod.includes(' as ')) {
                if (mode === 'import')
                    mod = mod.split(' ').shift();
                else
                    mod = mod.split(' ').pop();
            }
            return mod;
        })
            .filter(mod => !!mod.length);
        return modules;
    }
    findFileExports(filePath, _recur = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_recur > 100) {
                throw new Error('File ${filePath} seem to be exporting from itself...');
            }
            const fileContent = this.explorer.getFileContent(filePath);
            const exports = fileContent.match(/export .+?;/g);
            if (!exports) {
                // No exports in the file
                return [];
            }
            const exportedModules = [];
            for (const expor of exports) {
                // TODO handle export of the type:
                // export MyClass, { Function1, Function2 };
                if (/^export \* from/.test(expor)) {
                    const rawModule = expor.match(/(["'])[^\1]*\1/g);
                    if (!rawModule) {
                        throw new Error(`Could not find rawModule name in '${expor}'`);
                    }
                    const moduleName = rawModule[0].slice(1, -1);
                    let modulePath = '';
                    try {
                        modulePath = this.resolveModuleName(moduleName, filePath);
                    }
                    catch (err) {
                        console.log();
                        console.log(err.message);
                    }
                    if (!modulePath) {
                        // Nothing to worry about, this is probably a native NodeJS module.
                        continue;
                    }
                    const moduleExports = yield this.findFileExports(modulePath, _recur + 1);
                    if (moduleExports)
                        exportedModules.push(...moduleExports);
                }
                else if (/^export (type|interface|const|class|function|enum)/.test(expor)) {
                    exportedModules.push(expor.split(/\W+/g)[2]);
                }
                else if (/^export (async function |abstract class)/.test(expor)) {
                    exportedModules.push(expor.split(/\W+/g)[3]);
                }
                else if (/^export \{/.test(expor)) {
                    try {
                        const rawExportNames = expor.match(/\{.*?\}/g);
                        const exportNames = this.parseCurvBracesModuleList(rawExportNames[0], 'export');
                        exportedModules.push(...exportNames);
                    }
                    catch (err) {
                        console.log('HERE > ', expor);
                        throw err;
                    }
                }
                else if (/^export default/.test(expor)) {
                    exportedModules.push('$default$');
                }
                else {
                    // Unrecognized export
                }
            }
            return exportedModules;
        });
    }
    parseModuleNames(importLine) {
        if (/^import \w+ from/.test(importLine)) {
            return ['$default$'];
        }
        else if (/^import \{/.test(importLine)) {
            const namedImports = [];
            importLine.replace(/\{[^}]*\}/, rawNamedModuleNames => {
                namedImports.push(...this.parseCurvBracesModuleList(rawNamedModuleNames, 'import'));
                return '';
            });
            return namedImports;
        }
        else if (/^import \*/.test(importLine)) {
            // Nothing to do, if there was an error, it was handled before in the module
            // resolution.
        }
        else if (/^import ['"]/.test(importLine)) {
            // Nothing to do, if there was an error, it was handled before in the module
            // resolution.
        }
        else {
            const namedImports = [];
            importLine.replace(/\{[^}]*\}/, rawNamedModuleNames => {
                namedImports.push(...this.parseCurvBracesModuleList(rawNamedModuleNames, 'import'));
                return '';
            });
            return [...namedImports, '$default$'];
        }
    }
    checkFileImports(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileContent = this.explorer.getFileContent(filePath);
            const imports = fileContent.match(/import .*?[;]/g);
            const problemImports = [];
            if (!imports)
                return;
            for (let impor of imports) {
                impor = impor.replace(/\btype /, '');
                const matches = impor.match(/(?:from|import)\s*(['"])([^\1]+?)\1/);
                if (!(matches === null || matches === void 0 ? void 0 : matches[2])) {
                    console.log(`\nCould not find the module name in :\n(${filePath})\n  ${impor}`);
                    continue;
                }
                const importedModules = this.parseModuleNames(impor);
                const moduleName = matches[2];
                let modulePath = '';
                try {
                    modulePath = this.resolveModuleName(moduleName, filePath);
                }
                catch (err) {
                    // There was an error when resolving the module name.
                    problemImports.push(...importedModules);
                    console.log('\nError while resolving the module');
                    console.log(err.message);
                    continue;
                }
                if (!modulePath) {
                    // Nothing to worry about, this is probably a native NodeJS module.
                    continue;
                }
                if (modulePath.includes('node_modules') ||
                    modulePath.endsWith('.js')) {
                    // Not supported yet.
                    continue;
                }
                const err = (moduleName) => {
                    problemImports.push(moduleName);
                    console.log(`\nCould not find '${kl.blue(moduleName)}' in '${kl.green(modulePath)}'\n${filePath}\n  ${impor}\n`);
                };
                const moduleExports = yield this.findFileExports(modulePath);
                for (const namedImport of importedModules) {
                    if (!moduleExports.includes(namedImport)) {
                        err(namedImport);
                    }
                }
            }
            return problemImports;
        });
    }
    removeDepFromFile(filePath, dependency) {
        let fileContent = fs.readFileSync(filePath, 'utf8');
        fileContent = fileContent.replace(/(['"])(\n[\n\s]*(?:import|class|export|enum|const|function))/g, '$1;$2');
        while (/(\bimport\b.*?([^;\n]))\n/.test(fileContent)) {
            // multi-line imports.
            fileContent = fileContent.replace(/(\bimport\b.*?([^;\n]))\n/, '$1 ');
        }
        while (/\bimport\b.*  /.test(fileContent)) {
            // Removing eventual double spaces.
            fileContent = fileContent.replace(/(\bimport\b.*)  +/, '$1 ');
        }
        const before = fileContent;
        fileContent = fileContent.replace(new RegExp(`import \\* as ${dependency} from '[^']*'.*\n?`), '');
        fileContent = fileContent.replace(new RegExp(`import ${dependency} from '[^']*'.*\n?`), '');
        fileContent = fileContent.replace(new RegExp(`import \\{\\s*${dependency}\\s*\\} from '[^']*'.*\n?`), '');
        fileContent = fileContent.replace(new RegExp(`(import \\{[^}]*)(?:${dependency}\\s*,|,\\s*${dependency})([^}]*\\} from '[^']*'.*\n?)`), '$1$2');
        fs.writeFileSync(filePath, fileContent);
        if (fileContent !== before) {
            return true;
        }
        return false;
    }
    findDepForFile(filePath, dependency, allDeps) {
        const runtime = new TsRuntime(filePath);
        const options = [];
        for (const [modulePath, exports] of allDeps) {
            if (exports.includes(dependency)) {
                let relativePath = path.relative(filePath, modulePath);
                if (relativePath.endsWith('/index.ts'))
                    relativePath = relativePath.slice(0, -'/index.ts'.length);
                if (relativePath.endsWith('.ts'))
                    relativePath = relativePath.slice(0, -'.ts'.length);
                const moduleName = runtime.createModuleName(filePath, modulePath);
                if (dependency !== '$default$') {
                    options.push(`import { ${dependency} } from '${moduleName}';`);
                }
            }
        }
        if (options.length) {
            options.sort((opt1, opt2) => opt1.length - opt2.length);
            return options[0];
        }
        else {
            console.log('―――――――――――――――――――――――――――――――――――――――――――――――――――');
            console.log(filePath);
            console.log(`Could not find the dependency '${dependency}' anywhere...\n`);
            return null;
        }
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const allDeps = new Map();
    const explorer = new FileExplorer();
    const allFiles = yield explorer.getAllTsFiles();
    const dependencyHandler = new DependencyHandler();
    for (const file of allFiles) {
        const fileExports = yield dependencyHandler.findFileExports(file);
        allDeps.set(file, fileExports);
    }
    if (process.argv.length > 2) {
        const file = process.argv[2];
        const dependencyHandler = new DependencyHandler();
        dependencyHandler.checkFileImports(file).then((problems) => __awaiter(void 0, void 0, void 0, function* () {
            if (problems) {
                console.log(problems);
                for (const problem of problems) {
                    const dep = dependencyHandler.findDepForFile(file, problem, allDeps);
                    if (dep) {
                        dependencyHandler.removeDepFromFile(file, problem);
                        const fileContent = fs.readFileSync(file, 'utf8');
                        fs.writeFileSync(file, dep + '\n' + fileContent);
                    }
                }
            }
        }));
    }
    else {
        const dependencyHandler = new DependencyHandler();
        for (const file of allFiles) {
            dependencyHandler.checkFileImports(file).then((problems) => __awaiter(void 0, void 0, void 0, function* () {
                if (problems) {
                    for (const problem of problems) {
                        const dep = dependencyHandler.findDepForFile(file, problem, allDeps);
                        if (dep) {
                            dependencyHandler.removeDepFromFile(file, problem);
                            const fileContent = fs.readFileSync(file, 'utf8');
                            fs.writeFileSync(file, dep + '\n' + fileContent);
                        }
                    }
                }
            }));
        }
    }
}))();
