import { beforeEach, describe, expect, it } from "vitest";
import { login } from "@/services/auth.service";

describe("demo login", () => {
  beforeEach(() => window.localStorage.clear());

  it("lets an active user sign in with the right password", async () => {
    const r = await login("admin", "admin123");
    expect(r.ok).toBe(true);
    expect(r.usuario?.rol).toBe("superadministrador");
  });

  it("rejects a wrong password", async () => {
    const r = await login("admin", "incorrecta");
    expect(r).toEqual({ ok: false, error: "credenciales" });
  });

  it("blocks an inactive account even with the right password", async () => {
    const r = await login("inactivo", "inactivo123");
    expect(r).toEqual({ ok: false, error: "inactivo" });
  });
});
