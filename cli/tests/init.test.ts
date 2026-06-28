import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/commands/init";

function tmp(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe("init", () => {
  it("genera estructura + onboarding (README, AGENTS, CLAUDE) para clases", () => {
    const target = tmp("aiep-init-");
    try {
      const created = runInit(target, { kind: "clases" });
      for (const f of ["README.md", "AGENTS.md", "CLAUDE.md", ".gitignore", "cronograma/README.md"]) {
        expect(fs.existsSync(path.join(target, f)), f).toBe(true);
      }
      expect(fs.existsSync(path.join(target, "clases"))).toBe(true);

      const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
      expect(agents).toContain("docs/audiencias.md");
      expect(agents).not.toContain("reuniones-vcm"); // clases no usa decks VcM
      expect(created).toContain("AGENTS.md");
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it("incluye reuniones-vcm en AGENTS para proyectos (--talleres)", () => {
    const target = tmp("aiep-initT-");
    try {
      runInit(target, { kind: "talleres" });
      expect(fs.existsSync(path.join(target, "talleres"))).toBe(true);
      const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
      expect(agents).toContain("reuniones-vcm");
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  it("no sobrescribe archivos existentes", () => {
    const target = tmp("aiep-initX-");
    try {
      fs.writeFileSync(path.join(target, "README.md"), "MIO");
      const created = runInit(target, { kind: "clases" });
      expect(created).not.toContain("README.md");
      expect(fs.readFileSync(path.join(target, "README.md"), "utf8")).toBe("MIO");
    } finally {
      fs.rmSync(target, { recursive: true, force: true });
    }
  });
});
