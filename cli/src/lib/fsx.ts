import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Lo que nunca se copia ni se hashea de un paquete/tooling.
const EXCLUDED_NAMES = new Set(["node_modules", "dist", "bin", "obj"]);

export function shouldExclude(name: string): boolean {
  return EXCLUDED_NAMES.has(name) || name.endsWith(".bak");
}

/** Copia recursiva excluyendo node_modules/dist/bin/obj y archivos .bak. */
export function copyDir(src: string, dest: string): void {
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (from: string) => !shouldExclude(path.basename(from)),
  });
}

/** Archivos (rutas relativas, ordenadas) de un dir, sin los excluidos. */
export function listFiles(root: string, rel = ""): string[] {
  const out: string[] = [];
  const dir = path.join(root, rel);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (shouldExclude(entry.name)) continue;
    const relPath = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) {
      out.push(...listFiles(root, relPath));
    } else {
      out.push(relPath);
    }
  }
  return out.sort();
}

/** Hash de contenido determinista de un archivo o directorio. */
export function hashPath(target: string): string {
  const h = crypto.createHash("sha256");
  if (fs.statSync(target).isDirectory()) {
    for (const rel of listFiles(target)) {
      h.update(rel.replace(/\\/g, "/"));
      h.update(fs.readFileSync(path.join(target, rel)));
    }
  } else {
    h.update(fs.readFileSync(target));
  }
  return h.digest("hex").slice(0, 16);
}

export function rmrf(target: string): void {
  fs.rmSync(target, { recursive: true, force: true });
}

/** Sube desde `start` hasta encontrar la raíz del framework (skills/ + packages/slides-system). */
export function findFrameworkRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const hasSkills = fs.existsSync(path.join(dir, "skills"));
    const hasSystem = fs.existsSync(path.join(dir, "packages", "slides-system"));
    if (hasSkills && hasSystem) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "No se encontró la raíz del framework (un directorio con skills/ y packages/slides-system)."
  );
}
