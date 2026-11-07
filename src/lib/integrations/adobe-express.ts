// SDK loading and transfer to Adobe remain disabled until explicitly approved.
export function validateAdobeImageOutput(data: unknown): string {
  if (typeof data !== "string") throw new Error("Invalid Adobe image");
  const match = /^(?:data:image\/(?:png|jpeg|webp);base64,)?([A-Za-z0-9+/]+={0,2})$/.exec(data);
  if (!match || match[1].length % 4 !== 0 || match[1].length > 14_000_000) throw new Error("Invalid Adobe image");
  return data;
}
