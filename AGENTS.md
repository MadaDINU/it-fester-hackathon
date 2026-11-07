# AGENTS.md — instructions for Codex and delegated agents (Madalin)

Project: **Loopwise** — AI growth agents for social media, built on real Instagram data. Next.js 15 + TypeScript + Supabase + Vercel. The full spec is in `docs/BLUEPRINT.md`. Read §1, §3, §4, §8 and your task in §6.2 before any work.

## Who you work for
Madalin. You own ONLY these paths:
- `src/app/layout.tsx`, `src/app/globals.css` (after checkpoint C0), `src/app/page.tsx`
- `src/app/(app)/**`
- `src/app/api/variants/**`, `src/app/api/creative/**`, `src/app/api/publications/**`, `src/app/api/comments/**`
- `src/components/app/**`
- `src/lib/db/publications.ts`, `src/lib/db/metrics.ts`, `src/lib/db/creatives.ts`
- `src/lib/integrations/**` (instagram.ts, notify.ts, adobe-express.ts), `src/lib/creative/**`, `src/lib/api-client.ts`, `src/lib/mock/**`

Read-only for you (you may import from them): `src/lib/contracts.ts`, `env.ts`, `supabase.ts`, `http.ts`, `src/lib/ml/**`, `src/lib/ai/fixtures.ts`, `src/lib/db/comments.ts` (use `markCommentReplied`), `src/components/ui/**`, all config files, `package.json`, migrations, docs.

## Rules
1. One task ID at a time (e.g. `M6a`); its acceptance criteria are the definition of done.
2. Never edit files outside your ownership list. If you need a change there, stop and describe it.
3. Never add or upgrade dependencies.
4. Types come from `src/lib/contracts.ts`. Validate request bodies with its Zod schemas. Respond with `ok()` / `fail()` from `src/lib/http.ts`.
5. Server code uses `supabaseAdmin` from `src/lib/supabase.ts`. Never use server env vars in client components.
6. **Instagram safety**: publishing defaults to the test account (`IG_PUBLISH_*`). Posting to the main account requires `account: "main"` AND `confirmMainAccount: true`; never bypass this. Never store or forward commenter usernames.
7. Verify Instagram endpoint and metric names against the current official Meta docs before coding; never guess.
8. Never commit secrets. Never push, merge or deploy without Madalin's approval.
9. Windows: use `npm` scripts; keep LF line endings.
10. Verify before reporting: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
11. Token economy: open only the files your task names plus `contracts.ts`; don't scan the repo.
12. End with the report format from BLUEPRINT §8.

## Delegation (OpenCode / Antigravity)
Delegate only UI-only tasks with a closed file list (M2, M3, M9, M11, the M14 page, parts of M4). Give the worker the task text from BLUEPRINT §6.2, the exact files, `contracts.ts`, `mock/fixtures.ts` and the acceptance criteria. Review the diff for ownership and contract compliance before approving.
