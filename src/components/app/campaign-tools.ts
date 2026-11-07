import { PublishRequest, type TCampaign, type TReelScript } from "@/lib/contracts";

export function rankVariants(variants: TCampaign["variants"]) { return [...variants].sort((a, b) => a.rank - b.rank); }
export function publicationRequest(platform: TCampaign["platform"], account: "publish" | "main" = "publish", confirmed = false) {
  if (account === "main" && !confirmed) throw new Error("Main account requires explicit confirmation");
  return PublishRequest.parse({ platform, account, ...(account === "main" ? { confirmMainAccount: true } : {}) });
}
export function reelScriptText(script: TReelScript) {
  return [`Hook: ${script.hook}`, `Duration: ${script.durationSeconds}s`, ...script.scenes.map(s => `${s.seconds}s · ${s.visual}\nText: ${s.onScreenText}\nVoiceover: ${s.voiceover ?? "None"}`), `Audio: ${script.audioDirection}`, `Cover: ${script.coverText}`, `Editing: ${script.editingNotes.join("; ")}`, `TikTok: ${script.tiktokRepurpose}`].join("\n\n");
}
