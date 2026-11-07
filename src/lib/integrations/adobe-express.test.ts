import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ADOBE_APP_NAME, editImageInAdobe, validateAdobeImageOutput } from "./adobe-express";

it("accepts PNG, JPEG and raw base64 for the existing M5 renderer", () => {
  expect(validateAdobeImageOutput("data:image/png;base64,YWJj")).toBe("data:image/png;base64,YWJj");
  expect(validateAdobeImageOutput("data:image/jpeg;base64,YWJj")).toBe("data:image/jpeg;base64,YWJj");
  expect(validateAdobeImageOutput("YWJj")).toBe("YWJj");
});
it("rejects external URLs, malformed payloads and unsupported file types", () => {
  expect(() => validateAdobeImageOutput("https://unexpected.example/image")).toThrow();
  expect(() => validateAdobeImageOutput("data:image/svg+xml;base64,YWJj")).toThrow();
  expect(() => validateAdobeImageOutput("a")).toThrow();
  expect(() => validateAdobeImageOutput(null)).toThrow();
});

describe("editImageInAdobe", () => {
  type Callbacks = { onPublish: (i: unknown, p: { asset: { data: unknown }[] }) => void; onCancel?: () => void };
  let react: (cb: Callbacks) => void = () => {};
  const editImage = vi.fn((_doc: unknown, app: { callbacks: Callbacks }) => react(app.callbacks));
  const initialize = vi.fn().mockResolvedValue({ module: { editImage } });
  beforeAll(() => vi.stubGlobal("window", { CCEverywhere: { initialize } }));
  afterAll(() => vi.unstubAllGlobals());

  it("initialises with the client id, preloads the image and returns the published asset", async () => {
    react = cb => cb.onPublish("publish", { asset: [{ data: "data:image/png;base64,ZWRpdA==" }] });
    await expect(editImageInAdobe("client-1", "data:image/png;base64,YWJj")).resolves.toBe("data:image/png;base64,ZWRpdA==");
    expect(initialize).toHaveBeenCalledWith({ clientId: "client-1", appName: ADOBE_APP_NAME }, { loginMode: "delayed" });
    expect(editImage.mock.calls[0][0]).toEqual({ asset: { data: "data:image/png;base64,YWJj", dataType: "base64", type: "image" } });
  });
  it("returns null on cancel and rejects an unexpected published asset", async () => {
    react = cb => cb.onCancel?.();
    await expect(editImageInAdobe("client-1", "YWJj")).resolves.toBeNull();
    react = cb => cb.onPublish("publish", { asset: [{ data: "https://evil.example/x.png" }] });
    await expect(editImageInAdobe("client-1", "YWJj")).rejects.toThrow("Invalid Adobe image");
  });
});
