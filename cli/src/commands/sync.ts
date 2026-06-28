import fs from "node:fs";
import path from "node:path";
import { copyDir, hashPath, rmrf } from "../lib/fsx";
import { Lock, readLock, writeLock } from "../lib/manifest";

export type SyncStatus = "new" | "updated" | "unchanged" | "skipped" | "missing";

export interface SyncItem {
  label: string;
  from: string;
  to: string;
  kind: "dir" | "file";
}

export interface SyncResult {
  label: string;
  to: string;
  status: SyncStatus;
}

export interface SyncOptions {
  dryRun: boolean;
  /** Sobrescribe el destino aunque tenga modificaciones locales no sincronizadas. */
  force: boolean;
}

// Las docs del framework que las skills referencian por ruta del repo destino.
const SYNCED_DOCS = ["audiencias.md", "estandares.md", "framework.md", "estructura-repo.md"];

/** Qué se instala y dónde, dado un repo de framework. */
export function buildPlan(frameworkRoot: string): SyncItem[] {
  const items: SyncItem[] = [];

  const skillsDir = path.join(frameworkRoot, "skills");
  for (const name of fs.readdirSync(skillsDir).sort()) {
    const abs = path.join(skillsDir, name);
    if (!fs.statSync(abs).isDirectory()) continue;
    items.push({ label: `skill:${name}`, from: abs, to: path.join(".agent", "skills", name), kind: "dir" });
  }

  for (const pkg of ["slides-system", "pptx-validator", "pbip-validator"]) {
    items.push({
      label: pkg,
      from: path.join(frameworkRoot, "packages", pkg),
      to: path.join("tools", pkg),
      kind: "dir",
    });
  }

  for (const doc of SYNCED_DOCS) {
    items.push({
      label: `docs/${doc}`,
      from: path.join(frameworkRoot, "docs", doc),
      to: path.join("docs", doc),
      kind: "file",
    });
  }

  return items;
}

/** Instala/actualiza las skills y el tooling en `targetRoot`, escribiendo el lock. */
export function runSync(
  frameworkRoot: string,
  targetRoot: string,
  frameworkVersion: string,
  opts: SyncOptions
): SyncResult[] {
  const items = buildPlan(frameworkRoot);
  const prev = readLock(targetRoot);
  const now = new Date().toISOString();
  const lock: Lock = { framework: frameworkVersion, generatedAt: now, items: {} };
  const results: SyncResult[] = [];

  for (const item of items) {
    if (!fs.existsSync(item.from)) {
      results.push({ label: item.label, to: item.to, status: "missing" });
      continue;
    }

    const frameworkHash = hashPath(item.from);
    const dest = path.join(targetRoot, item.to);
    const destExists = fs.existsSync(dest);
    const prevEntry = prev?.items[item.label];
    const destHash = destExists ? hashPath(dest) : undefined;

    // El status compara el contenido EN DISCO con el del framework; la protección
    // mira si lo que hay en disco difiere de lo último sincronizado (edición local
    // o dir no gestionado por el lock), en cuyo caso no se sobrescribe salvo --force.
    let status: SyncStatus;
    if (!destExists) {
      status = "new";
    } else if (destHash === frameworkHash) {
      status = "unchanged";
    } else {
      const locallyModified = destHash !== prevEntry?.hash;
      status = locallyModified && !opts.force ? "skipped" : "updated";
    }

    if (!opts.dryRun && (status === "new" || status === "updated")) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (item.kind === "dir") {
        rmrf(dest);
        copyDir(item.from, dest);
      } else {
        fs.copyFileSync(item.from, dest);
      }
    }

    if (status === "skipped") {
      if (prevEntry) lock.items[item.label] = prevEntry; // preservar registro previo
    } else {
      const syncedAt = status === "unchanged" ? prevEntry?.syncedAt ?? now : now;
      lock.items[item.label] = { hash: frameworkHash, syncedAt };
    }
    results.push({ label: item.label, to: item.to, status });
  }

  if (!opts.dryRun) {
    writeLock(targetRoot, lock);
  }

  return results;
}
