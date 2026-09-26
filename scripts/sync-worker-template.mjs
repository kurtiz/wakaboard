import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repoRoot, "apps/worker");
const templateRoot = join(repoRoot, "deploy/worker");
const checkOnly = process.argv.includes("--check");

async function filesUnder(root, directory) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(relative(root, path));
    }
  }
  await visit(join(root, directory));
  return files.sort();
}

const directories = ["src", "migrations"];
let mismatches = 0;

for (const directory of directories) {
  const sourceFiles = await filesUnder(sourceRoot, directory);
  const templateFiles = await filesUnder(templateRoot, directory);
  for (const file of sourceFiles) {
    const source = join(sourceRoot, file);
    const target = join(templateRoot, file);
    const sourceContent = await readFile(source);
    const targetContent = await readFile(target).catch(() => null);
    if (targetContent?.equals(sourceContent)) continue;
    mismatches += 1;
    if (checkOnly) {
      process.stderr.write(`Template differs: ${file}\n`);
    } else {
      await mkdir(dirname(target), { recursive: true });
      await copyFile(source, target);
      process.stdout.write(`Updated template: ${file}\n`);
    }
  }
  for (const file of templateFiles) {
    if (sourceFiles.includes(file)) continue;
    mismatches += 1;
    process.stderr.write(`Template has an extra file: ${file}\n`);
  }
}

if (checkOnly && mismatches > 0) process.exitCode = 1;
else if (mismatches === 0) process.stdout.write("Worker template source and migrations are in sync.\n");
