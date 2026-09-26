import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = join(repositoryRoot, "apps/mobile");
const appModules = join(appRoot, "node_modules");
const output = join(appRoot, "src/data/open-source-packages.json");
const app = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf8"));
const directNames = new Set(Object.keys(app.dependencies).filter((name) => !name.startsWith("@wakaboard/")));
const directPaths = new Set([...directNames].map((name) => realpathSync(join(appModules, name))));
const seenPaths = new Set();
const packages = new Map();

function containingNodeModules(packageRoot) {
  let directory = dirname(packageRoot);
  while (directory !== dirname(directory) && directory.split("/").at(-1) !== "node_modules") {
    directory = dirname(directory);
  }
  return directory;
}

function visit(name, modules) {
  let packageRoot = join(modules, name);
  if (!existsSync(packageRoot)) packageRoot = join(appModules, name);
  if (!existsSync(packageRoot)) throw new Error(`Cannot resolve ${name} from ${modules}`);
  packageRoot = realpathSync(packageRoot);
  if (seenPaths.has(packageRoot)) return;
  seenPaths.add(packageRoot);

  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  if (!manifest.name.startsWith("@wakaboard/")) {
    if (typeof manifest.license !== "string") throw new Error(`Missing license metadata: ${manifest.name}@${manifest.version}`);
    packages.set(`${manifest.name}@${manifest.version}`, {
      name: manifest.name,
      version: manifest.version,
      license: manifest.license,
      direct: directPaths.has(packageRoot),
    });
  }
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    visit(dependency, containingNodeModules(packageRoot));
  }
}

for (const name of Object.keys(app.dependencies)) visit(name, appModules);

const sorted = [...packages.values()].sort((a, b) =>
  Number(b.direct) - Number(a.direct) ||
  (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) ||
  (a.version < b.version ? -1 : a.version > b.version ? 1 : 0),
);
const generated = `${JSON.stringify(sorted, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (!existsSync(output) || readFileSync(output, "utf8") !== generated) {
    console.error("Mobile credits are out of date. Run pnpm credits:generate.");
    process.exitCode = 1;
  }
} else {
  writeFileSync(output, generated);
  console.log(`Wrote ${sorted.length} mobile dependency credits.`);
}
