// cspell:ignore forec frobnicate
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main } from "../src/index";

describe("parsing de argumentos", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("help retorna 0", () => {
    expect(main(["node", "cli", "help"])).toBe(0);
  });

  it("rechaza una flag desconocida en sync", () => {
    expect(main(["node", "cli", "sync", os.tmpdir(), "--forec"])).toBe(1);
  });

  it("rechaza --force en init (flag inaplicable al comando)", () => {
    expect(main(["node", "cli", "init", os.tmpdir(), "--force"])).toBe(1);
  });

  it("rechaza múltiples posicionales (destino con espacios sin comillas)", () => {
    expect(main(["node", "cli", "sync", "C:\\My", "Course"])).toBe(1);
  });

  it("comando desconocido retorna 1", () => {
    expect(main(["node", "cli", "frobnicate"])).toBe(1);
  });
});
