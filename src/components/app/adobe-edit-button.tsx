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
  if (!reel || !variant.reelScript?.editingNotes.length) return button;
  return <div className="w-full space-y-2 rounded-lg border p-3">{button}<p className="text-xs font-semibold text-slate-600">Editing notes (cover is edited here; cut the video in Adobe Express)</p><ul className="list-inside list-disc text-xs text-slate-600">{variant.reelScript.editingNotes.map((note, i) => <li key={i}>{note}</li>)}</ul></div>;
}
