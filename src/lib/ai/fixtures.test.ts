import { describe, expect, it } from "vitest";
import { mockIgSnapshot } from "@/lib/ai/fixtures";
import { IgSnapshot } from "@/lib/contracts";

describe("mockIgSnapshot", () => {
  it("is valid against the IgSnapshot contract", () => {
    expect(() => IgSnapshot.parse(mockIgSnapshot)).not.toThrow();
  });

  it("has 30 posts, newest first, covering every format", () => {
    const { media } = mockIgSnapshot;
    expect(media).toHaveLength(30);
    expect(new Set(media.map((m) => m.mediaType)).size).toBe(3);
    const times = media.map((m) => Date.parse(m.timestamp));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("only has comments on media in the snapshot", () => {
    const ids = new Set(mockIgSnapshot.media.map((m) => m.id));
    expect(mockIgSnapshot.comments.every((c) => ids.has(c.mediaId))).toBe(true);
  });
});
