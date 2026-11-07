# Loopwise: submission

- **App:** https://loopwise-ruddy.vercel.app
- **Repository:** https://github.com/MadaDINU/it-fester-hackathon
- **Team:** Fane (backend, AI agents, ML, data) and Madalin (frontend, integrations, creative)

## What it does
Loopwise is a team of AI agents that relaunches and grows an Instagram account from its real audience data.
It builds personas from the account's demographics, writes posts and reels, and tests them on a synthetic focus group and on a model trained on the account's history before anything is published.
After each post it learns from the results, and it keeps followers engaged with loyalty ideas and reply drafts.

| Agent | Role |
|---|---|
| Analyst | Imports the account, computes performance in code, trains the ridge-regression predictor, writes data-backed learnings |
| Audience | Builds brand DNA and 4 personas grounded in real demographics |
| Creator | Writes post, carousel and reel variants (hook, scenes, on-screen text, editing notes) |
| Critic | Synthetic focus group: every persona reacts to every variant; also checks that each variant respects the learnings it claims |
| Community | Loyalty ideas from the audience; classifies comments and drafts replies once comments exist |

## Integrations
- **Instagram Graph API** (graph.facebook.com v27.0): live read of profile, demographics, media, insights and comments.
- **Discord:** campaign-ready notification for human approval; delivery confirmed.
- **Anthropic:** Claude Sonnet 5.5 writes, Claude Haiku 5.5 evaluates.
- **Supabase:** Postgres with row-level security and Storage for creatives.
- **Vercel:** hosting.

## Judging criteria and evidence
| Criterion | Weight | Evidence |
|---|---|---|
| Problem | 25% | Real account @ironcladwind: 134,585 followers, 0 posts, −921 net followers in 30 days |
| AI innovation | 25% | 5 cooperating agents (`src/lib/core/`), synthetic focus group (`campaign.ts`), predictor trained on the account (`src/lib/ml/`), learning loop with learning-compliance check |
| Technical | 25% | Zod contracts for every API and LLM output (`src/lib/contracts.ts`); model routing Sonnet/Haiku (campaign 57 s → 39–52 s); AI budget guard returning 402 (`src/lib/ai/client.ts`); 160+ automated tests; RLS-protected Postgres |
| Integrations | 15% | Instagram Graph API live (`src/lib/integrations/instagram.ts`), Discord confirmed (`notify.ts`), Supabase, Vercel, Anthropic |
| Demo | 10% | Live on the real account, with prepared fallbacks (`docs/LOCAL-DEMO.md`, `scripts/rehearsal-check.ts`) |
| Bonus: cost vs value | +10% | Every AI call metered in `ai_usage`; ~€0.05 per campaign; ROI meter in the app |

## Real vs simulated
| Item | Status |
|---|---|
| Followers, 0 posts, −921 in 30 days, demographics | **Real** |
| Niche, personas, campaign, loyalty ideas | **AI-generated** from the real data |
| Discord notification | **Real** (delivery confirmed) |
| 30-post history, R² 0.89, learnings | **Simulated**, labelled "Simulated history" in the app |
| Publishing to Instagram | **Mock**: nothing is posted to the real account |

## Measured AI cost
| Operation | Cost |
|---|---|
| New brand (import + audience) | ~€0.026 |
| Campaign (4 variants + focus group) | ~€0.05 |
| Per post variant (campaign ÷ variants) | ~€0.01 |
| Learning loop | ~€0.013 |
| Community | ~€0.001 |
| Whole hackathon, all real-AI tests | ~€0.52 |

## Running it
See [LOCAL-DEMO.md](LOCAL-DEMO.md).

## Known limitations
- **Cold start:** the demo account has no posts, so there are no real post metrics or comments yet.
- **Simulated history:** the learning loop is shown on 30 simulated posts, labelled as such; the R² is not a result for the account.
- **Publishing is mocked:** no post is ever sent to Instagram in this build.
- **Meta App Review:** reading accounts other than the app's testers requires Meta App Review.
- **Latency:** a campaign takes ~40–52 s (3–4 variants), close to the 60 s function limit on Vercel; the main demo runs locally.
