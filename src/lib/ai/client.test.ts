import { describe, expect, it } from "vitest";
import { agentFixtures } from "@/lib/ai/agent-fixtures";
import { AIError, generateJSON, parseJSONText } from "@/lib/ai/client";
import {
  AudienceOutput,
  CommunityOutput,
  CreatorOutput,
  CriticOutput,
  LearningOutput,
  WebsiteOutput,
} from "@/lib/ai/prompts";
import { Goal } from "@/lib/contracts";

describe("agent fixtures", () => {
  const cases = {
    audienceAnalysis: AudienceOutput,
    brandAnalysis: WebsiteOutput,
    campaignVariants: CreatorOutput,
    focusGroup: CriticOutput,
    learningInsights: LearningOutput,
    communityAnalysis: CommunityOutput,
  };

  it.each(Object.entries(cases))("%s matches its schema", (name, schema) => {
    expect(() => schema.parse(agentFixtures[name])).not.toThrow();
  });

  it("has persona shares that sum to 1", () => {
    const { personas } = AudienceOutput.parse(agentFixtures.audienceAnalysis);
    expect(personas.reduce((sum, p) => sum + p.segmentShare, 0)).toBeCloseTo(1);
  });
});

describe("CreatorOutput", () => {
  it("rejects a reel without a script", () => {
    const { variants } = CreatorOutput.parse(agentFixtures.campaignVariants);
    const broken = { variants: [{ ...variants[0], reelScript: null }] };
    expect(CreatorOutput.safeParse(broken).success).toBe(false);
  });
});

describe("parseJSONText", () => {
  it("strips code fences", () => {
    expect(parseJSONText('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJSONText(' {"a":1} ')).toEqual({ a: 1 });
  });
});

describe("generateJSON in mock mode", () => {
  const base = { system: "s", prompt: "p", usage: { operation: "test" } };

  it("returns the fixture and survives a metering failure", async () => {
    const result = await generateJSON({ ...base, schema: LearningOutput, fixture: "learningInsights" });
    expect(result.learnings).toHaveLength(3);
  });

  it("throws AIError when the fixture does not match the schema", async () => {
    await expect(generateJSON({ ...base, schema: Goal, fixture: "learningInsights" })).rejects.toBeInstanceOf(AIError);
  });
});
