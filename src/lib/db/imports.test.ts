import { describe, expect, it } from "vitest";
import { latestPerPublication } from "@/lib/db/imports";

const row = (id: string, publication_id: string, captured_at: string, reach: number) => ({
  id,
  publication_id,
  captured_at,
  reach,
});

describe("latestPerPublication", () => {
  it("keeps one row per publication, the latest capture", () => {
    const rows = [
      row("b", "p1", "2026-11-07T10:00:00Z", 100),
      row("a", "p1", "2026-11-07T12:00:00Z", 300),
      row("c", "p1", "2026-11-07T11:00:00Z", 200),
      row("d", "p2", "2026-11-07T09:00:00Z", 50),
    ];
    const result = latestPerPublication(rows);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.publication_id === "p1")?.reach).toBe(300);
  });

  it("does not multiply samples when simulate runs repeatedly", () => {
    const t = "2026-11-07T12:00:00Z";
    const rows = Array.from({ length: 5 }, (_, i) => row(`id${i}`, "p1", t, i));
    expect(latestPerPublication(rows)).toEqual([rows[4]]);
  });
});
