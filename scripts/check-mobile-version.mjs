import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const app = JSON.parse(readFileSync(join(root, "apps/mobile/app.json"), "utf8")).expo;
const pkg = JSON.parse(readFileSync(join(root, "apps/mobile/package.json"), "utf8"));

if (app.version !== pkg.version || !/^\d+\.\d+\.\d+$/.test(app.version)) {
  throw new Error("The Expo and mobile package versions must match as MAJOR.MINOR.PATCH.");
}
if (!Number.isInteger(app.android.versionCode) || app.android.versionCode < 1) {
  throw new Error("android.versionCode must be a positive integer.");
}
if (!/^\d+$/.test(app.ios.buildNumber) || Number(app.ios.buildNumber) < 1) {
  throw new Error("ios.buildNumber must be a positive integer string.");
}
