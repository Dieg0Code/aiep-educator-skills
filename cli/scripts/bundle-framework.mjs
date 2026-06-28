// Copia los assets del framework (skills/, docs/, packages selectos) dentro de
// cli/framework/ para que el paquete npm los lleve consigo. Se corre en prepack;
// findFrameworkRoot detecta este bundle cuando el CLI se instala desde npm.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(here, "..");
const repoRoot = path.resolve(cliRoot, "..");
const dest = path.join(cliRoot, "framework");

const EXCLUDE = new Set(["node_modules", "dist", "bin", "obj"]);
const filter = (src) => {
  const base = path.basename(src);
  return !EXCLUDE.has(base) && !base.endsWith(".bak");
};

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

for (const dir of ["skills", "docs"]) {
  fs.cpSync(path.join(repoRoot, dir), path.join(dest, dir), { recursive: true, filter });
}

fs.mkdirSync(path.join(dest, "packages"), { recursive: true });
for (const pkg of ["slides-system", "pptx-validator", "pbip-validator"]) {
  fs.cpSync(path.join(repoRoot, "packages", pkg), path.join(dest, "packages", pkg), {
    recursive: true,
    filter,
  });
}

console.log("Bundle del framework listo en", path.relative(repoRoot, dest));
