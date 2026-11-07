"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { TVariant } from "@/lib/contracts";
import { api } from "@/lib/api-client";
import { editImageInAdobe, imageToBase64 } from "@/lib/integrations/adobe-express";
import { Button } from "@/components/ui/button";

const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID?.trim() ?? "";

export function AdobeEditButton({ variant, imageSrc, disabled, onSaved }: { variant: TVariant; imageSrc: string; disabled?: boolean; onSaved: (imageUrl: string) => void }) {
  const [working, setWorking] = useState(false);
  if (!clientId) return null;
  const reel = variant.format === "reel";
  async function edit() {
    // Adobe only allows its editor to be framed by https pages; on http the iframe is blocked silently.
    if (window.location.protocol !== "https:") { toast.error("Adobe Express needs HTTPS. Open Loopwise on its https:// address to edit this creative."); return; }
    setWorking(true);
    try {
      const edited = await editImageInAdobe(clientId, await imageToBase64(imageSrc));
      if (!edited) return;
      const result = await api.renderVariant(variant.id, { imageBase64: edited });
      onSaved(result.imageUrl);
      toast.success("Adobe Express edit saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Adobe Express edit failed"); }
    finally { setWorking(false); }
  }
  const button = <Button variant="outline" className="min-h-11" disabled={disabled || working} onClick={() => void edit()}>{working ? "Opening Adobe…" : reel ? "Open Adobe Express" : "Edit in Adobe Express"}</Button>;
  return button;
}
