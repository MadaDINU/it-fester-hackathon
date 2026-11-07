import { describe, expect, it } from "vitest";
import { agentFixtures } from "@/lib/ai/agent-fixtures";
import { AudienceOutput, CommunityOutput } from "@/lib/ai/prompts";
import { unsupportedPromise } from "@/lib/ai/reply-guard";

const { dna } = AudienceOutput.parse(agentFixtures.audienceAnalysis);

describe("unsupportedPromise", () => {
  it("accepts every fixture reply", () => {
    const { comments } = CommunityOutput.parse(agentFixtures.communityAnalysis);
    for (const c of comments) expect(unsupportedPromise(c.suggestedReply ?? "", dna)).toBeNull();
  });

  it.each([
    "DM me and I'll send you a special offer!",
    "Use code FIT20 for 20% off this week",
    "The plan is only €9.99 today",
    "Send me a message and I'll get you a discount",
    "Scrie-mi în privat și îți trimit o reducere",
    "Primești planul gratuit dacă ne urmărești",
  ])("rejects %j", (reply) => {
    expect(unsupportedPromise(reply, dna)).not.toBeNull();
  });

  it("allows an offer the brand DNA actually contains", () => {
    const withOffer = { ...dna, products: [...dna.products, "Free first week of the plan"] };
    expect(unsupportedPromise("Your first week of the plan is free!", withOffer)).toBeNull();
  });

  it("allows a DM invitation for a personal question", () => {
    expect(unsupportedPromise("Sorry about your knee. Send me a DM with details and I'll suggest safer moves.", dna)).toBeNull();
  });
});
