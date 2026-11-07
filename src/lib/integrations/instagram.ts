import { mockIgSnapshot } from "@/lib/ai/fixtures";
import type { TIgSnapshot } from "@/lib/contracts";

// F0 stub: always returns the mock snapshot. Madalin replaces this in task M6a.
export async function fetchInstagramSnapshot({ limit = 50 }: { limit?: number } = {}): Promise<TIgSnapshot> {
  const media = mockIgSnapshot.media.slice(0, limit);
  const ids = new Set(media.map((m) => m.id));
  return {
    ...mockIgSnapshot,
    media,
    comments: mockIgSnapshot.comments.filter((c) => ids.has(c.mediaId)),
  };
}
