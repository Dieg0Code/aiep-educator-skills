import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findFrameworkRoot } from "../src/lib/fsx";
import { runSync } from "../src/commands/sync";
import { readLock, LOCK_FILE } from "../src/lib/manifest";

const frameworkRoot = findFrameworkRoot(__dirname);

function tmp(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe("sync", () => {
  it("instala skills, tooling y docs en el destino y escribe el lock", () => {
    const target = tmp("aiep-sync-");
    try {
      const results = runSync(frameworkRoot, target, "9.9.9", { dryRun: false, force: false });

      expect(fs.existsSync(path.join(target, ".agent/skills/reuniones-vcm/SKILL.md"))).toBe(true);
      expect(fs.existsSync(path.join(target, ".agent/skills/infografias-aiep/SKILL.md"))).toBe(true);
      expect(fs.existsSync(path.join(target, "tools/slides-system/components/vcm-lockup.js"))).toBe(true);
      expect(fs.existsSync(path.join(target, "tools/slides-system/node_modules"))).toBe(false);
      expect(fs.existsSync(path.join(target, "docs/audiencias.md"))).toBe(true);

      const lock = readLock(target);
      expect(lock).not.toBeNull();
      expect(lock?.framework).toBe("9.9.9");
      expect(results.every((r) => r.status === "new")).toBe(true);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it("la segunda sincronización deja todo unchanged", () => {
    const target = tmp("aiep-sync2-");
    try {
      runSync(frameworkRoot, target, "9.9.9", { dryRun: false, force: false });
      const again = runSync(frameworkRoot, target, "9.9.9", { dryRun: false, force: false });
      expect(again.every((r) => r.status === "unchanged")).toBe(true);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it("dry-run no escribe nada", () => {
    const target = tmp("aiep-dry-");
    try {
      runSync(frameworkRoot, target, "9.9.9", { dryRun: true, force: false });
      expect(fs.existsSync(path.join(target, ".agent"))).toBe(false);
      expect(fs.existsSync(path.join(target, LOCK_FILE))).toBe(false);
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it("protege ediciones locales: skip sin --force, reemplazo con --force", () => {
    const target = tmp("aiep-guard-");
    try {
      runSync(frameworkRoot, target, "9.9.9", { dryRun: false, force: false });
      const skillFile = path.join(target, ".agent/skills/reuniones-vcm/SKILL.md");
      fs.writeFileSync(skillFile, "EDITADO LOCALMENTE");

      const r1 = runSync(frameworkRoot, target, "9.9.9", { dryRun: false, force: false });
      expect(r1.find((r) => r.label === "skill:reuniones-vcm")?.status).toBe("skipped");
      expect(fs.readFileSync(skillFile, "utf8")).toBe("EDITADO LOCALMENTE");

      const r2 = runSync(frameworkRoot, target, "9.9.9", { dryRun: false, force: true });
      expect(r2.find((r) => r.label === "skill:reuniones-vcm")?.status).toBe("updated");
      expect(fs.readFileSync(skillFile, "utf8")).not.toBe("EDITADO LOCALMENTE");
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });
});
