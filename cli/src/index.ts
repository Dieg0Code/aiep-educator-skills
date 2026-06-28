import fs from "node:fs";
import path from "node:path";
import { findFrameworkRoot } from "./lib/fsx";
import { runSync, SyncResult } from "./commands/sync";
import { RepoKind, runInit } from "./commands/init";

const HELP = `aiep-skills — framework docente AIEP

Uso:
  aiep-skills sync [destino] [--dry-run] [--force]   Instala/actualiza skills y tooling en un repo de curso.
  aiep-skills init [destino] [--talleres]  Andamia la estructura del repo y luego sincroniza.
  aiep-skills help                         Muestra esta ayuda.

Si se omite [destino], se usa el directorio actual.
`;

function frameworkVersion(frameworkRoot: string): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(frameworkRoot, "package.json"), "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printResults(results: SyncResult[]): void {
  const icon: Record<string, string> = {
    new: "+", updated: "~", unchanged: "=", skipped: "·", missing: "!",
  };
  for (const r of results) {
    console.log(`  ${icon[r.status] ?? "?"} ${r.status.padEnd(9)} ${r.label} -> ${r.to}`);
  }
  const missing = results.filter((r) => r.status === "missing");
  if (missing.length > 0) {
    console.log(`\n  Aviso: ${missing.length} ítem(s) no existen en el framework y se omitieron.`);
  }
  const skipped = results.filter((r) => r.status === "skipped");
  if (skipped.length > 0) {
    console.log(
      `\n  Aviso: ${skipped.length} ítem(s) con cambios locales no se sobrescribieron. ` +
        `Usar --force para reemplazarlos con la versión del framework.`
    );
  }
}

function resolveTarget(arg: string | undefined): string {
  return path.resolve(arg ?? process.cwd());
}

/** Rechaza posicionales de más (típico: path con espacios sin comillas) y flags no reconocidas. */
function validateArgs(positional: string[], flags: Set<string>, allowedFlags: string[]): string | null {
  if (positional.length > 1) {
    return (
      `Demasiados argumentos (${positional.length}): ${positional.join(" | ")}. ` +
      `Si el destino tiene espacios, debe ir entre comillas.`
    );
  }
  for (const flag of flags) {
    if (!allowedFlags.includes(flag)) {
      return `Flag desconocida para este comando: ${flag}. Permitidas: ${allowedFlags.join(", ") || "(ninguna)"}.`;
    }
  }
  return null;
}

export function main(argv: string[]): number {
  const args = argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(HELP);
    return 0;
  }

  const positional = args.slice(1).filter((a) => !a.startsWith("-"));
  const flags = new Set(args.filter((a) => a.startsWith("-")));
  const frameworkRoot = findFrameworkRoot(__dirname);
  const version = frameworkVersion(frameworkRoot);

  if (command === "sync") {
    const err = validateArgs(positional, flags, ["--dry-run", "--force"]);
    if (err) {
      console.error(err);
      return 1;
    }
    const target = resolveTarget(positional[0]);
    const dryRun = flags.has("--dry-run");
    const force = flags.has("--force");
    console.log(`aiep-skills sync${dryRun ? " (dry-run)" : ""}${force ? " (force)" : ""}  framework@${version}`);
    console.log(`destino: ${target}\n`);
    const results = runSync(frameworkRoot, target, version, { dryRun, force });
    printResults(results);
    console.log(dryRun ? "\nDry-run: no se escribió nada." : "\nListo. Lock: aiep-skills-lock.json");
    return 0;
  }

  if (command === "init") {
    const err = validateArgs(positional, flags, ["--talleres"]);
    if (err) {
      console.error(err);
      return 1;
    }
    const target = resolveTarget(positional[0]);
    const kind: RepoKind = flags.has("--talleres") ? "talleres" : "clases";
    console.log(`aiep-skills init (${kind})  destino: ${target}\n`);
    const created = runInit(target, { kind });
    for (const c of created) console.log(`  + ${c}`);
    if (created.length === 0) console.log("  (estructura ya existía)");
    console.log("\nSincronizando skills y tooling...\n");
    const results = runSync(frameworkRoot, target, version, { dryRun: false, force: false });
    printResults(results);
    console.log("\nListo.");
    return 0;
  }

  console.error(`Comando desconocido: ${command}\n`);
  console.log(HELP);
  return 1;
}

if (require.main === module) {
  process.exit(main(process.argv));
}
