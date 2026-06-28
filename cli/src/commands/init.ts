import fs from "node:fs";
import path from "node:path";

export type RepoKind = "clases" | "talleres";

export interface InitOptions {
  kind: RepoKind;
}

interface TemplateVars {
  title: string;
  kind: RepoKind;
  kindLabel: string;
  unitExample: string;
}

/* cspell:disable */
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

function cronogramaReadmeTemplate(v: TemplateVars): string {
  return `# Cronograma

La planificación de este ${v.kindLabel.toLowerCase()} en el tiempo. Es la columna vertebral:
toda unidad de \`${v.kind}/\` deriva de aquí.

_Reemplazar este texto por el cronograma real (fechas, foco por semana/etapa, evaluaciones)._
`;
}

function readmeTemplate(v: TemplateVars): string {
  return `# ${v.title}

${v.kindLabel} de AIEP, planificado con el framework docente **aiep-educator-skills**. Este repo
automatiza buena parte del trabajo de planificar: el contenido, los decks, las infografías y la
comunicación se producen con skills de agente consistentes con la identidad AIEP.

## Cómo está organizado

- \`docs/\` — documentos que comparte AIEP (programa, planificaciones). Fuente oficial: no se inventa.
- \`cronograma/\` — la planificación en el tiempo. **Empezar por aquí.**
- \`${v.kind}/\` — el cuerpo del trabajo. Cada unidad (ej. \`${v.unitExample}/\`) tiene:
  \`README.md\` (el contenido), \`ppt/\` (el deck), y los complementos \`infografia/\` y \`podcast/\`.
- \`.agent/skills/\` — las skills de agente instaladas (ver \`AGENTS.md\`).
- \`tools/\` — el sistema de slides y los validadores.

## Cómo trabajar aquí

1. Definir o leer el \`cronograma/README.md\`.
2. Para cada unidad: redactar su \`README.md\`, después el deck, y luego los complementos.
3. Validar el deck antes de cerrarlo (que abra en PowerPoint sin reparar).

Se puede hacer a mano o delegar a un agente (Claude Code / Codex): las skills ya están instaladas y
la guía para el agente está en \`AGENTS.md\`. Las convenciones completas están en
\`docs/estandares.md\` y el registro por audiencia en \`docs/audiencias.md\`.

> Mantener el repo al día con el framework: \`aiep-skills sync\` actualiza skills y tooling.
`;
}

function agentsTemplate(v: TemplateVars): string {
  const vcmLine =
    v.kind === "talleres"
      ? "- `reuniones-vcm` — decks de Vinculación con el Medio (sello VcM, registro institucional para directiva/externos).\n"
      : "";
  return `# Guía para agentes — ${v.title}

${v.kindLabel} de AIEP. Aquí se produce material docente (contenido, decks, infografías,
evaluaciones, comunicación) con las skills instaladas en \`.agent/skills/\`. El idioma es español
neutro, con tildes y ñ.

## Antes de producir cualquier cosa

1. **Declarar la audiencia** y leer \`docs/audiencias.md\`. El registro cambia: a los alumnos
   técnicos se les habla con código y jerga; a directiva, otros docentes o externos, claro y sin
   tecnicismo.
2. Respetar la **jerarquía de verdad**: \`docs/\` (oficial AIEP) > \`cronograma/README.md\` >
   \`${v.kind}/.../README.md\` > el deck. El deck DERIVA del README; no inventa otra versión.
3. Leer \`docs/estandares.md\` para nombres, estructura de la carpeta-unidad, idioma/tono y el flujo
   de validación.

## Las skills (\`.agent/skills/\`)

- \`clase-design\` — estructurar y redactar la unidad (README, bloques, ejercicios, cierre).
- \`slides-aiep\` — identidad visual del deck (paleta, logo, densidad según audiencia).
- \`infografias-aiep\` — infografías estilo AIEP con GPT Image (brief + revisión; sin API).
- \`evaluacion-design\` — evaluaciones y rúbricas.
- \`cohort-comms\` — mensajes a la cohorte (WhatsApp).
${vcmLine}
## Tooling (\`tools/\`)

- \`slides-system\` — tema + componentes PptxGenJS. Construir los decks reutilizándolo, no a mano.
- \`pptx-validator\` (.NET) — integridad del \`.pptx\`. Antes de cerrar un deck:
  \`dotnet run --project tools/pptx-validator -- archivo.pptx\`.

## Flujo típico de una unidad

\`cronograma\` → \`README.md\` de la unidad → \`ppt/\` (deck) → validar → \`infografia/\` + \`podcast/\`.
No cerrar un deck con overflow, mojibake o si PowerPoint intenta repararlo.
`;
}

function claudeTemplate(): string {
  return `# CLAUDE.md

Este repo usa la guía de agentes en **\`AGENTS.md\`**: es lo primero que se debe leer. Las
convenciones del framework están en \`docs/estandares.md\` y \`docs/audiencias.md\`, y las skills en
\`.agent/skills/\`.
`;
}
/* cspell:enable */

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeIfAbsent(file: string, content: string): boolean {
  if (fs.existsSync(file)) return false;
  fs.writeFileSync(file, content);
  return true;
}

/** Andamia la estructura estándar de un repo de curso/proyecto AIEP, con onboarding para profe y agente. */
export function runInit(targetRoot: string, opts: InitOptions): string[] {
  const created: string[] = [];
  const vars: TemplateVars = {
    title: path.basename(targetRoot),
    kind: opts.kind,
    kindLabel: opts.kind === "clases" ? "Módulo de clases" : "Proyecto",
    unitExample: opts.kind === "clases" ? "clases/semana-01/01" : "talleres/01",
  };

  for (const dir of ["docs", "cronograma", opts.kind]) {
    const abs = path.join(targetRoot, dir);
    if (!fs.existsSync(abs)) {
      ensureDir(abs);
      created.push(`${dir}/`);
    }
  }

  const files: Array<[string, string]> = [
    [path.join("cronograma", "README.md"), cronogramaReadmeTemplate(vars)],
    ["README.md", readmeTemplate(vars)],
    ["AGENTS.md", agentsTemplate(vars)],
    ["CLAUDE.md", claudeTemplate()],
    [".gitignore", GITIGNORE],
  ];
  for (const [rel, content] of files) {
    if (writeIfAbsent(path.join(targetRoot, rel), content)) {
      created.push(rel);
    }
  }

  return created;
}
