import fs from "node:fs";
import path from "node:path";

export type RepoKind = "clases" | "talleres";

export interface InitOptions {
  kind: RepoKind;
}

const GITIGNORE = `# Dependencias / entornos
**/node_modules/
**/.venv/
**/__pycache__/
**/*.pyc

# Artefactos de build
**/bin/
**/obj/
**/dist/
*.bak

# Previews de render de PPT (regenerables)
**/ppt/rendered*/
**/ppt/montage*.png

# Entregables comprimidos (no versionar)
/entregables/
*.rar

# Ruido de SO/editor
.DS_Store
Thumbs.db
~$*
`;

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeIfAbsent(file: string, content: string): boolean {
  if (fs.existsSync(file)) return false;
  fs.writeFileSync(file, content);
  return true;
}

/** Andamia la estructura estándar de un repo de curso/proyecto AIEP. */
export function runInit(targetRoot: string, opts: InitOptions): string[] {
  const created: string[] = [];

  for (const dir of ["docs", "cronograma", opts.kind]) {
    const abs = path.join(targetRoot, dir);
    if (!fs.existsSync(abs)) {
      ensureDir(abs);
      created.push(`${dir}/`);
    }
  }

  const cronogramaReadme = path.join(targetRoot, "cronograma", "README.md");
  if (writeIfAbsent(cronogramaReadme, "# Cronograma\n\n_Planificación del módulo/proyecto en el tiempo._\n")) {
    created.push("cronograma/README.md");
  }

  const gitignore = path.join(targetRoot, ".gitignore");
  if (writeIfAbsent(gitignore, GITIGNORE)) {
    created.push(".gitignore");
  }

  return created;
}
