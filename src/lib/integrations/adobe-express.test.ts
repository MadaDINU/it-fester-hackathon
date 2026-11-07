import { expect, it } from "vitest";
import { validateAdobeImageOutput } from "./adobe-express";

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
