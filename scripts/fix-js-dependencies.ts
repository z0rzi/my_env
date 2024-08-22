#!/bin/bun

import { $ } from "bun";
import path from "path";
import fs from "fs";
import kl from "kleur";

import prompts from "prompts";

class FileExplorer {
  findFileInParentDirs(fileName: string, basePath: string): string {
    let rootpath = path.resolve(basePath);

    while (rootpath !== "/" && !fs.existsSync(path.join(rootpath, fileName)))
      rootpath = path.dirname(rootpath);

    if (rootpath === "/") {
      console.log(`Could not find the ${fileName} file...`);
      process.exit(1);
    }

    return path.join(rootpath, fileName);
  }

  /**
   * Gets the content of a file, without newlines.
   */
  getFileContent(path: string) {
    return fs
      .readFileSync(path, "utf8")
      .replace(/\n\s*\/\/.*?(?=\n)/g, "")
      .replace(/}[\s\n]*$/g, "};")
      .replace(/\nimport\b/g, ";import")
      .replace(/\nexport\b/g, ";export")
      .replace(/\n/g, "")
      .replace(/\/\*.*?\*\//g, "");
  }

  isDir(path: string) {
    try {
      return fs.lstatSync(path).isDirectory();
    } catch (err) {
      return false;
    }
  }

  isFile(path: string) {
    try {
      return fs.lstatSync(path).isFile();
    } catch (err) {
      return false;
    }
  }

  /**
   * Makes sure that a path exists.
   * The path can omit the file extension.
   *
   * @param packagePath The path to the package. Should be absolute.
   *
   * @returns The path to the file if it exists, null otherwise.
   */
  verifyPathExists(packagePath: string) {
    try {
      if (this.isFile(packagePath)) return packagePath;
    } catch (_) {}

    try {
      if (this.isDir(packagePath)) {
        let indexPath = path.join(packagePath, "index.ts");
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
        indexPath = path.join(packagePath, "index.d.ts");
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
        indexPath = path.join(packagePath, "index.js");
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }

        // If we land in a node module directory, we should look for the main file.
        let packageJsonPath = path.join(packagePath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8")
          );
          let props = ["types", "typings", "main", "module"];
          for (const prop of props) {
            if (packageJson[prop]) {
              let mainPath = path.join(packagePath, packageJson[prop]);
              if (fs.existsSync(mainPath)) return mainPath;
            }
          }
        }
      }

      let extensions = [".ts", ".d.ts", ".tsx", ".js", ".jsx"];
      for (const ext of extensions) {
        if (fs.existsSync(packagePath + ext)) return packagePath + ext;
      }
    } catch (err) {}
    return null;
  }

  async getAllTsFiles(): Promise<string[]> {
    const res = await $`fd "\\.ts$"`.text();
    return res.trim().split("\n");
  }
}

class TsRuntime {
  aliases = new Map<string, string>();
  tsconfigPath = "";
  packageJsonPath = "";
  basePath = "";
  nodeModulesPath = "";

  private explorer = new FileExplorer();

  constructor(filePath: string) {
    this.tsconfigPath = this.explorer.findFileInParentDirs(
      "tsconfig.json",
      filePath
    );
    this.packageJsonPath = this.explorer.findFileInParentDirs(
      "package.json",
      filePath
    );
    this.nodeModulesPath = path.join(
      path.dirname(this.packageJsonPath),
      "node_modules"
    );

    const tsconfigJson = JSON.parse(fs.readFileSync(this.tsconfigPath, "utf8"));

    const baseUrl: string = tsconfigJson["compilerOptions"]["baseUrl"] || ".";

    this.basePath = path.join(path.dirname(this.tsconfigPath), baseUrl);

    const aliases = tsconfigJson["compilerOptions"]?.["paths"] as Record<
      string,
      string[]
    >;

    if (!aliases) return;

    for (const key of Object.keys(aliases)) {
      let alias = key;
      if (alias.endsWith("*")) alias = alias.slice(0, -1);

      let destination = aliases[key][0];
      if (destination.endsWith("*")) destination = destination.slice(0, -1);

      this.aliases.set(alias, destination);
    }
  }

  takeAliasOff(moduleName: string): string | null {
    for (const [alias, destination] of this.aliases) {
      if (!alias.endsWith("/")) {
        if (alias === moduleName) {
          // Cases where the alias refers to an exact file
          return destination;
        } else {
          continue;
        }
      }
      if (!alias) continue;

      if (moduleName.startsWith(alias)) {
        return moduleName.replace(alias, destination);
      }
    }

    return null;
  }

  /**
   * Creates a module name from a file path, using the tsconfig aliases.
   */
  createModulePath(filePath: string, modulePath: string) {
    if (modulePath.endsWith("/index.ts"))
      modulePath = modulePath.slice(0, -"/index.ts".length);

    if (modulePath.endsWith(".ts"))
      modulePath = modulePath.slice(0, -".ts".length);

    const baseRelativePath = path.relative(this.basePath, modulePath);

    let aliasPath = "";

    for (const [alias, destination] of this.aliases) {
      if (!destination.endsWith("/")) {
        if (destination === baseRelativePath) {
          // Cases where the alias refers to an exact file
          if (!aliasPath || alias.length < aliasPath.length) {
            aliasPath = alias;
          }
        } else {
          continue;
        }
      }

      if (baseRelativePath.startsWith(destination)) {
        const newAlias = baseRelativePath.replace(destination, alias);
        if (!aliasPath || newAlias.length < aliasPath.length) {
          aliasPath = newAlias;
        }
      }
    }

    let relative = path.relative(path.dirname(filePath), modulePath);
    if (!relative.startsWith(".")) relative = "./" + relative;

    if (!aliasPath || aliasPath.length > relative.length) {
      return relative;
    }
    return aliasPath;
  }
}

class DependencyHandler {
  private runtime: TsRuntime;
  private explorer = new FileExplorer();

  constructor(dirPath: string) {
    this.runtime = new TsRuntime(dirPath);
  }

  /**
   * Tries to resolve a non-relative package path
   * Looks for it in the node_modules directory, and if it's not there, it looks
   * for it in the tsconfig paths. (alias)
   */
  private resolvePackageModuleName(packageName: string, filePath: string) {
    const moduleDirPath = path.join(this.runtime.nodeModulesPath, packageName);

    const modulefilePath = this.explorer.verifyPathExists(moduleDirPath);
    if (modulefilePath) {
      // We're pointing directly to a file.
      return modulefilePath;
    }

    if (!fs.existsSync(moduleDirPath)) {
      throw new Error(
        `${filePath}\nCan't find package '${packageName}' in node_modules...`
      );
    }

    const packageJsonPath = path.join(moduleDirPath, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    const moduleMainFile = packageJson["main"] as string;
    const moduleMainFilePath = path.join(moduleDirPath, moduleMainFile);

    const actualFile = this.explorer.verifyPathExists(moduleMainFilePath);
    if (!actualFile) {
      throw new Error(`Could not resolve the npm dependency '${packageName}'`);
    }

    return actualFile;
  }

  resolveModulePath(packageName: string, filePath: string) {
    if (
      ["fs", "path", "http"].includes(packageName) ||
      packageName.endsWith(".json")
    ) {
      return "";
    }

    const newPackageName = this.runtime.takeAliasOff(packageName);

    if (!!newPackageName) {
      // It was an alias
      packageName = newPackageName;
    }

    if (packageName.startsWith(".")) {
      // It's a relative path. Can be from the file itself or from tsconfig basepath

      let packagePath = path.join(path.dirname(filePath), packageName);
      let fullPath = this.explorer.verifyPathExists(packagePath);
      if (fullPath) return fullPath;

      packagePath = path.join(this.runtime.basePath, packageName);
      fullPath = this.explorer.verifyPathExists(packagePath);

      if (fullPath) return fullPath;

      throw new Error(
        `Could not resolve relative package '${packageName}' in file '${filePath}'`
      );
    } else {
      // It can be a package from node_modules or it can be using a tsconfig alias

      const basePath = this.explorer.verifyPathExists(
        path.join(this.runtime.basePath, packageName)
      );
      if (basePath) return basePath;

      return this.resolvePackageModuleName(packageName, filePath);
    }
  }

  /**
   * '{ Day, DayHelper, Night, NightHelper as NH }'
   *   => ['Day', 'DayHelper', 'Night', 'NH']
   */
  private parseCurvBracesModuleList(
    raw: string,
    mode: "import" | "export"
  ): string[] {
    const modules = raw
      .slice(1, -1)
      .split(",")
      .map((mod) => {
        mod = mod.trim();
        if (mod.includes(" as ")) {
          if (mode === "import") mod = mod.split(" ").shift()!;
          else mod = mod.split(" ").pop()!;
        }
        return mod;
      })
      .filter((mod) => !!mod.length);
    return modules;
  }

  async findFileExports(filePath: string, _recur = 0): Promise<string[]> {
    if (_recur > 100) {
      throw new Error("File ${filePath} seem to be exporting from itself...");
    }

    const fileContent = this.explorer.getFileContent(filePath);
    const exports = fileContent.match(/export .+?;/g);
    if (!exports) {
      // No exports in the file
      return [];
    }
    const exportedModules: string[] = [];
    for (const expor of exports) {
      // TODO handle export of the type:
      // export MyClass, { Function1, Function2 };
      if (/^export \* from/.test(expor)) {
        const rawModule = expor.match(/(["'])[^\1]*\1/g);
        if (!rawModule) {
          throw new Error(`Could not find rawModule name in '${expor}'`);
        }
        const moduleName = rawModule[0].slice(1, -1);
        let modulePath = "";
        try {
          modulePath = this.resolveModulePath(moduleName, filePath);
        } catch (err) {
          console.log();
          if (err instanceof Error) console.log(err?.message);
        }

        if (!modulePath) {
          // Nothing to worry about, this is probably a native NodeJS module.
          continue;
        }
        const moduleExports = await this.findFileExports(
          modulePath,
          _recur + 1
        );
        if (moduleExports) exportedModules.push(...moduleExports);
      } else if (
        /^export (type|interface|const|class|function|enum)/.test(expor)
      ) {
        exportedModules.push(expor.split(/\W+/g)[2]);
      } else if (/^export (async function |abstract class)/.test(expor)) {
        exportedModules.push(expor.split(/\W+/g)[3]);
      } else if (/^export \{/.test(expor)) {
        try {
          const rawExportNames = expor.match(/\{.*?\}/g);
          const exportNames = this.parseCurvBracesModuleList(
            rawExportNames![0],
            "export"
          );
          exportedModules.push(...exportNames);
        } catch (err) {
          throw err;
        }
      } else if (/^export default/.test(expor)) {
        exportedModules.push("$default$");
      } else {
        // Unrecognized export
      }
    }

    return exportedModules;
  }

  private parseModuleNames(importLine: string): string[] {
    if (/^import \w+ from/.test(importLine)) {
      return ["$default$"];
    } else if (/^import \{/.test(importLine)) {
      const namedImports: string[] = [];
      importLine.replace(/\{[^}]*\}/, (rawNamedModuleNames) => {
        namedImports.push(
          ...this.parseCurvBracesModuleList(rawNamedModuleNames, "import")
        );
        return "";
      });

      return namedImports;
    } else if (/^import \*/.test(importLine)) {
      // Nothing to do, if there was an error, it was handled before in the module
      // resolution.
    } else if (/^import ['"]/.test(importLine)) {
      // Nothing to do, if there was an error, it was handled before in the module
      // resolution.
    } else {
      const namedImports: string[] = [];
      importLine.replace(/\{[^}]*\}/, (rawNamedModuleNames) => {
        namedImports.push(
          ...this.parseCurvBracesModuleList(rawNamedModuleNames, "import")
        );
        return "";
      });

      return [...namedImports, "$default$"];
    }
    return [];
  }

  /**
   * Finds all the imports in a file.
   *
   * @param filePath The path to the file.
   *
   * @returns A map where the keys are the module paths and the values are the
   *          imported modules.
   *          Example: '@app/model' => ['A', 'B']
   */
  async findFileImports(filePath: string): Promise<Map<string, string[]>> {
    const fileContent = this.explorer.getFileContent(filePath);
    const rawImports = fileContent.match(/import .*?[;]/g);

    const imports = new Map<string, string[]>();

    if (!rawImports) return imports;
    for (let rawImport of rawImports) {
      rawImport = rawImport.replace(/\btype /, "");

      const matches = rawImport.match(/(?:from|import)\s*(['"])([^\1]+?)\1/);
      if (!matches?.[2]) {
        console.log(
          `\nCould not find the module name in :\n(${filePath})\n  ${rawImport}`
        );
        continue;
      }

      const importedModules = this.parseModuleNames(rawImport);

      const modulePath = matches[2];

      imports.set(modulePath, importedModules);
    }

    return imports;
  }

  async checkFileImports(filePath: string): Promise<string[]> {
    const fileContent = this.explorer.getFileContent(filePath);
    const imports = fileContent.match(/import .*?[;]/g);

    const problemImports = [] as string[];

    if (!imports) return [];
    for (let impor of imports) {
      impor = impor.replace(/\btype /, "");

      const matches = impor.match(/(?:from|import)\s*(['"])([^\1]+?)\1/);
      if (!matches?.[2]) {
        console.log(
          `\nCould not find the module name in :\n(${filePath})\n  ${impor}`
        );
        continue;
      }

      const importedModules = this.parseModuleNames(impor);

      const modulePath = matches[2];

      console.log(modulePath, importedModules);

      let moduleRealPath = "";
      try {
        moduleRealPath = this.resolveModulePath(modulePath, filePath);
      } catch (err) {
        // There was an error when resolving the module name.
        problemImports.push(...importedModules);
        console.log("\nError while resolving the module");
        if (err instanceof Error) console.log(err.message);
        continue;
      }

      if (!moduleRealPath) {
        // Nothing to worry about, this is probably a native NodeJS module.
        continue;
      }

      if (
        moduleRealPath.includes("node_modules") ||
        moduleRealPath.endsWith(".js")
      ) {
        // Not supported yet.
        continue;
      }

      const err = (modulePath: string) => {
        problemImports.push(modulePath);
        console.log(
          `\nCould not find '${kl.blue(modulePath)}' in '${kl.green(
            moduleRealPath
          )}'\n${filePath}\n  ${impor}\n`
        );
      };

      const moduleExports = await this.findFileExports(moduleRealPath);
      for (const namedImport of importedModules) {
        if (!moduleExports.includes(namedImport)) {
          err(namedImport);
        }
      }
    }

    return problemImports;
  }

  /**
   * Tries to find the file which exports this module.
   *
   * @param moduleName The name of the imported module, e.g. 'Person'
   * @param lastSeenPath The path of the imported file (which should be incorrect)
   *
   * @returns The path of the file which exports the module, or null if it wasn't found.
   */
  async findModuleExport(
    moduleName: string,
    allExports: Map<string, string[]>
  ) {
    for (const [modulePath, exports] of allExports) {
      if (exports.includes(moduleName)) {
        return modulePath;
      }
    }
    return null;
  }

  /**
   * Removes a dependency from a file.
   *
   * @param filePath The path to the file.
   * @param dependency The name of the dependency to remove. (e.g. 'Circle')
   */
  removeImportFromFile(filePath: string, dependency: string) {
    let fileContent = fs.readFileSync(filePath, "utf8");

    fileContent = fileContent.replace(
      /(['"])(\n[\n\s]*(?:import|class|export|enum|const|function))/g,
      "$1;$2"
    );

    while (/(\bimport\b.*?([^;\n]))\n/.test(fileContent)) {
      // multi-line imports.
      fileContent = fileContent.replace(/(\bimport\b.*?([^;\n]))\n/, "$1 ");
    }
    while (/\bimport\b.*  /.test(fileContent)) {
      // Removing eventual double spaces.
      fileContent = fileContent.replace(/(\bimport\b.*)  +/, "$1 ");
    }

    const before = fileContent;

    fileContent = fileContent.replace(
      new RegExp(`import \\* as ${dependency} from '[^']*'.*\n?`),
      ""
    );
    fileContent = fileContent.replace(
      new RegExp(`import ${dependency} from '[^']*'.*\n?`),
      ""
    );
    fileContent = fileContent.replace(
      new RegExp(`import \\{\\s*${dependency}\\s*\\} from '[^']*'.*\n?`),
      ""
    );
    fileContent = fileContent.replace(
      new RegExp(
        `(import \\{[^}]*)(?:${dependency}\\s*,|,\\s*${dependency})([^}]*\\} from '[^']*'.*\n?)`
      ),
      "$1$2"
    );

    fs.writeFileSync(filePath, fileContent);

    if (fileContent !== before) {
      return true;
    }
    return false;
  }

  addImportToFile(filePath: string, packageName: string, modulePath: string) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const importStr = `import { ${packageName} } from '${modulePath}';`;
    fs.writeFileSync(filePath, importStr + "\n" + fileContent);
  }
}

const explorer = new FileExplorer();
const allFiles = await explorer.getAllTsFiles();
const dependencyHandler = new DependencyHandler("./");

// We create a map of all the exports in this project.
const allExports = new Map<string, string[]>();
for (const file of allFiles) {
  const fileExports = await dependencyHandler.findFileExports(file);
  allExports.set(file, fileExports);
}

let runtime = new TsRuntime('.');

for (const filePath of allFiles) {
  const imports = await dependencyHandler.findFileImports(filePath);
  for (const [modulePath, importedModules] of imports) {
    try {
      dependencyHandler.resolveModulePath(modulePath, filePath);
    } catch (err) {
      // There was an error when resolving the module name.
      // Probably, there is an error in the import statement.
      // Let's fix it!
      for (const importedModule of importedModules) {
        let newModulePath = await dependencyHandler.findModuleExport(
          importedModule,
          allExports
        );
        if (!newModulePath) {
          console.log(
            `Could not find the module '${importedModule}' anywhere...`
          );
          continue;
        }

        newModulePath = runtime.createModulePath(filePath, newModulePath);

        console.log("\n\n" + kl.gray(filePath) + "\n");
        console.log(
          kl.cyan("import ") +
            `{ ${kl.italic(kl.magenta(importedModule))} }` +
            kl.cyan(" from ") +
            kl.italic(kl.green(`'${modulePath}'`)) +
            ";"
        );
        console.log(kl.gray("  TO"));
        console.log(
          kl.cyan("import ") +
            `{ ${kl.italic(kl.magenta(importedModule))} }` +
            kl.cyan(" from ") +
            kl.italic(kl.green(`'${newModulePath}'`)) +
            ";"
        );
        console.log();

        const confirm = await prompts({
          type: "confirm",
          input: "confirm",
          name: "confirmModif",
          message: "Replace the import?",
          initial: true,
        });
        if (confirm.confirmModif == null) {
          // ^C
          process.exit(0);
        }
        if (confirm.confirmModif) {
          dependencyHandler.removeImportFromFile(filePath, importedModule);
          dependencyHandler.addImportToFile(
            filePath,
            importedModule,
            newModulePath
          );
        }
      }
    }
  }
}
