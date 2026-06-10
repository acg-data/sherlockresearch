import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(repoRoot, "sherlock-research");
const outputRoot = path.join(repoRoot, "dist");

const publicRootFiles = new Set([
  "_headers",
  "_redirects",
  "favicon.svg",
  "og-default.png",
  "robots.txt",
  "sitemap.xml"
]);

const privateRootFiles = new Set([
  "ops-launch-dashboard.html"
]);

const publicDirectories = new Set([
  "assets",
  "shared"
]);

function isPublicRootFile(name) {
  if (privateRootFiles.has(name)) return false;
  return name.endsWith(".html") || publicRootFiles.has(name);
}

async function main() {
  try {
    await rm(outputRoot, { recursive: true, force: true });
  } catch (error) {
    if (!["EBUSY", "EPERM"].includes(error?.code)) throw error;
    console.warn(`WARN: Could not remove ${outputRoot} (${error.code}); copying assets in place.`);
  }
  await mkdir(outputRoot, { recursive: true });

  const entries = await readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(sourceRoot, entry.name);
    const to = path.join(outputRoot, entry.name);

    if (entry.isDirectory()) {
      if (publicDirectories.has(entry.name)) {
        await cp(from, to, { recursive: true, force: true });
      }
      continue;
    }

    if (entry.isFile() && isPublicRootFile(entry.name)) {
      await cp(from, to, { force: true });
    }
  }

  console.log(`Prepared public assets in ${outputRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
