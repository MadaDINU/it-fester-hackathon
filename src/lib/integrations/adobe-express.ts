// Adobe Express Embed SDK v4, verified against developer.adobe.com/express/embed-sdk (quickstart + modules guide)
// and the official AdobeDocs/embed-sdk-samples v4 modules.html: script URL, initialize(hostInfo, configParams),
// module.editImage(docConfig, appConfig) and onPublish(intent, publishParams) -> publishParams.asset[0].data.
export const ADOBE_SDK_URL = "https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js";
// Must equal the credential name in Adobe Developer Console.
export const ADOBE_APP_NAME = "Loopwise";

type PublishParams = { asset: { data: unknown }[] };
type AdobeModule = {
  editImage: (
    docConfig: { asset: { data: string; dataType: "base64"; type: "image" } },
    appConfig: { callbacks: { onPublish: (intent: unknown, params: PublishParams) => void; onCancel?: () => void; onError?: (err: unknown) => void } },
  ) => void;
};
type CCEverywhere = { initialize: (host: { clientId: string; appName: string }, config: { loginMode: "delayed" }) => Promise<{ module: AdobeModule }> };
declare global { interface Window { CCEverywhere?: CCEverywhere } }

export function validateAdobeImageOutput(data: unknown): string {
  if (typeof data !== "string") throw new Error("Invalid Adobe image");
  const match = /^(?:data:image\/(?:png|jpeg|webp);base64,)?([A-Za-z0-9+/]+={0,2})$/.exec(data);
  if (!match || match[1].length % 4 !== 0 || match[1].length > 14_000_000) throw new Error("Invalid Adobe image");
  return data;
}

let sdk: Promise<AdobeModule> | null = null;
// The SDK must be initialised once per page, so the promise is cached; a failure clears it for retry.
export function loadAdobeExpress(clientId: string): Promise<AdobeModule> {
  if (typeof window === "undefined") return Promise.reject(new Error("Adobe Express runs in the browser only"));
  sdk ??= new Promise<void>((resolve, reject) => {
    if (window.CCEverywhere) return resolve();
    const script = document.createElement("script");
    script.src = ADOBE_SDK_URL; script.async = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load Adobe Express SDK"));
    document.head.appendChild(script);
  }).then(async () => {
    if (!window.CCEverywhere) throw new Error("Adobe Express SDK unavailable");
    return (await window.CCEverywhere.initialize({ clientId, appName: ADOBE_APP_NAME }, { loginMode: "delayed" })).module;
  }).catch(err => { sdk = null; throw err; });
  return sdk;
}

export async function imageToBase64(src: string): Promise<string> {
  if (src.startsWith("data:")) return validateAdobeImageOutput(src);
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Unable to load creative (HTTP ${response.status})`);
  const blob = await response.blob();
  return validateAdobeImageOutput(await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Unable to read creative"));
    reader.readAsDataURL(blob);
  }));
}

// Resolves with the edited image as a validated data URL, or null if the user cancels.
export async function editImageInAdobe(clientId: string, imageBase64: string): Promise<string | null> {
  const adobe = await loadAdobeExpress(clientId);
  return new Promise((resolve, reject) => adobe.editImage(
    { asset: { data: imageBase64, dataType: "base64", type: "image" } },
    { callbacks: {
      onPublish: (_intent, params) => { try { resolve(validateAdobeImageOutput(params.asset?.[0]?.data)); } catch (e) { reject(e); } },
      onCancel: () => resolve(null),
      onError: err => reject(err instanceof Error ? err : new Error("Adobe Express error")),
    } },
  ));
}
