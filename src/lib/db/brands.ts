import {
  Brand,
  BrandWithContext,
  Persona,
  type TAudienceProfile,
  type TBrand,
  type TBrandDNA,
  type TBrandWithContext,
  type TPersona,
} from "@/lib/contracts";
import { countImportedPosts } from "@/lib/db/imports";
import { listLearnings } from "@/lib/db/learnings";
import { supabaseAdmin } from "@/lib/supabase";

type BrandRow = {
  id: string;
  name: string;
  website_url: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  followers: number | null;
  dna: unknown;
  audience: unknown;
  created_at: string;
};

function toBrand(r: BrandRow): TBrand {
  return Brand.parse({
    id: r.id,
    name: r.name,
    websiteUrl: r.website_url,
    instagram:
      r.ig_user_id && r.ig_username
        ? { userId: r.ig_user_id, username: r.ig_username, followers: r.followers ?? 0 }
        : null,
    dna: r.dna,
    audience: r.audience,
    createdAt: r.created_at,
  });
}

export async function listBrands(): Promise<TBrand[]> {
  const { data, error } = await supabaseAdmin
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toBrand);
}

export async function findBrandIdByIgUser(igUserId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("brands")
    .select("id")
    .eq("ig_user_id", igUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function insertInstagramBrand(fields: {
  name: string;
  igUserId: string;
  igUsername: string;
  followers: number;
  websiteUrl: string | null;
  dna: TBrandDNA;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("brands")
    .insert({
      name: fields.name,
      ig_user_id: fields.igUserId,
      ig_username: fields.igUsername,
      followers: fields.followers,
      website_url: fields.websiteUrl,
      dna: fields.dna,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function insertWebsiteBrand(fields: {
  name: string;
  websiteUrl: string | null;
  dna: TBrandDNA;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("brands")
    .insert({ name: fields.name, website_url: fields.websiteUrl, dna: fields.dna, audience: null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateBrandProfile(
  id: string,
  fields: { name?: string; followers?: number; dna?: TBrandDNA; audience?: TAudienceProfile },
): Promise<void> {
  const { error } = await supabaseAdmin.from("brands").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("brands").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function replacePersonas(
  brandId: string,
  personas: Array<Omit<TPersona, "id" | "brandId">>,
): Promise<void> {
  const removed = await supabaseAdmin.from("personas").delete().eq("brand_id", brandId);
  if (removed.error) throw new Error(removed.error.message);
  const { error } = await supabaseAdmin.from("personas").insert(
    personas.map((p) => ({
      brand_id: brandId,
      name: p.name,
      age_range: p.ageRange,
      gender: p.gender,
      location: p.location,
      description: p.description,
      motivations: p.motivations,
      pain_points: p.painPoints,
      content_they_love: p.contentTheyLove,
      preferred_format: p.preferredFormat,
      segment_share: p.segmentShare,
      grounded_in: p.groundedIn,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function listPersonas(brandId: string): Promise<TPersona[]> {
  const { data, error } = await supabaseAdmin
    .from("personas")
    .select("*")
    .eq("brand_id", brandId)
    .order("segment_share", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((r) =>
    Persona.parse({
      id: r.id,
      brandId: r.brand_id,
      name: r.name,
      ageRange: r.age_range,
      gender: r.gender,
      location: r.location,
      description: r.description,
      motivations: r.motivations,
      painPoints: r.pain_points,
      contentTheyLove: r.content_they_love,
      preferredFormat: r.preferred_format,
      segmentShare: Number(r.segment_share),
      groundedIn: r.grounded_in,
    }),
  );
}

export async function getBrandWithContext(id: string): Promise<TBrandWithContext | null> {
  const { data, error } = await supabaseAdmin.from("brands").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [personas, learnings, importedPosts] = await Promise.all([
    listPersonas(id),
    listLearnings(id),
    countImportedPosts(id),
  ]);
  return BrandWithContext.parse({ ...toBrand(data), personas, learnings, importedPosts });
}
