import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseDesktopProjectFile, safeFilename, tauriFileSaveAdapter } from "./files";

const desktopMocks = vi.hoisted(() => ({
  open: vi.fn(),
  save: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({ open: desktopMocks.open, save: desktopMocks.save }));
vi.mock("@tauri-apps/plugin-fs", () => ({ readFile: desktopMocks.readFile, writeFile: desktopMocks.writeFile }));

describe("safe export filenames", () => {
  it.each([
    ["  My package / proof  ", "My-package-proof"],
    ["../../unsafe", "unsafe"],
    ["", "dieline"],
    ["carton_v2-final", "carton_v2-final"],
  ])("normalises %j", (input, expected) => expect(safeFilename(input)).toBe(expected));

  it("limits filenames to a portable length", () => {
    expect(safeFilename("a".repeat(400))).toHaveLength(120);
  });
});

describe("native Windows project files", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    desktopMocks.open.mockReset();
    desktopMocks.save.mockReset();
    desktopMocks.readFile.mockReset();
    desktopMocks.writeFile.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("opens the native Save dialog and writes to the selected PC path", async () => {
    const path = "C:\\Users\\Example\\Documents\\carton.pdgproj";
    desktopMocks.save.mockResolvedValue(path);
    const result = await tauriFileSaveAdapter.save(new Blob(["project"]), "carton.pdgproj", "Project");
    expect(desktopMocks.save).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: "carton.pdgproj" }));
    expect(desktopMocks.writeFile).toHaveBeenCalledWith(path, expect.any(Uint8Array));
    expect(result.path).toBe(path);
  });

  it("preserves an edited filename and adds the required export extension", async () => {
    const selectedPath = "D:\\Client exports\\renamed-carton";
    desktopMocks.save.mockResolvedValue(selectedPath);
    const result = await tauriFileSaveAdapter.save(new Blob(["<svg />"]), "carton.svg", "Editable SVG dieline");
    expect(desktopMocks.writeFile).toHaveBeenCalledWith(`${selectedPath}.svg`, expect.any(Uint8Array));
    expect(result).toMatchObject({
      filename: "renamed-carton.svg",
      path: `${selectedPath}.svg`,
      cancelled: false,
    });
  });

  it("treats Save dialog cancellation as a clean no-op", async () => {
    desktopMocks.save.mockResolvedValue(null);
    const result = await tauriFileSaveAdapter.save(new Blob(["<svg />"]), "carton.svg", "Editable SVG dieline");
    expect(desktopMocks.writeFile).not.toHaveBeenCalled();
    expect(result.cancelled).toBe(true);
  });

  it("rejects invalid remembered paths before writing", async () => {
    await expect(tauriFileSaveAdapter.save(new Blob(["project"]), "carton.pdgproj", "Project", { targetPath: "\0" }))
      .rejects.toThrow(/invalid/i);
    expect(desktopMocks.writeFile).not.toHaveBeenCalled();
  });

  it("turns Windows permission failures into repair guidance", async () => {
    desktopMocks.save.mockResolvedValue("C:\\Protected\\carton.svg");
    desktopMocks.writeFile.mockRejectedValue(new Error("Access is denied. (os error 5)"));
    await expect(tauriFileSaveAdapter.save(new Blob(["<svg />"]), "carton.svg", "Editable SVG dieline"))
      .rejects.toThrow(/choose another folder|permissions/i);
  });

  it("reuses a previously chosen project path without reopening the dialog", async () => {
    const path = "C:\\Users\\Example\\Documents\\carton.pdgproj";
    const result = await tauriFileSaveAdapter.save(new Blob(["updated"]), "carton.pdgproj", "Project", { targetPath: path });
    expect(desktopMocks.save).not.toHaveBeenCalled();
    expect(desktopMocks.writeFile).toHaveBeenCalledWith(path, expect.any(Uint8Array));
    expect(result.path).toBe(path);
  });

  it("opens a project through the native picker and reads only the selected file", async () => {
    const path = "C:\\Users\\Example\\Documents\\carton.pdgproj";
    desktopMocks.open.mockResolvedValue(path);
    desktopMocks.readFile.mockResolvedValue(new Uint8Array([80, 75, 3, 4]));
    const result = await chooseDesktopProjectFile();
    expect(desktopMocks.readFile).toHaveBeenCalledWith(path);
    expect(result?.path).toBe(path);
    expect(result?.file.name).toBe("carton.pdgproj");
  });
});
