# CLAUDE.md — instructions for Claude Code (Fane)

Project: **Loopwise** — AI growth agents for social media, built on real Instagram data. Next.js 15 + TypeScript + Supabase + Vercel. The full spec is in `docs/BLUEPRINT.md`. Read §1, §3, §4, §5, §8 and your task in §6.1 before any work.

## Who you work for
Fane. He owns the backend, the AI agents, the ML and data pipeline, and all shared configuration:
- Root config files, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `components.json`, `vitest.config.ts`, `.env.example`, `.gitattributes`, `.gitignore`, `README.md`
- `supabase/**`, `scripts/**`, `docs/**`, `AGENTS.md`, `CLAUDE.md`
- `src/lib/contracts.ts`, `env.ts`, `supabase.ts`, `http.ts`
- `src/lib/ai/**`, `src/lib/core/**`, `src/lib/ml/**`
- `src/lib/db/brands.ts`, `campaigns.ts`, `learnings.ts`, `model.ts`, `usage.ts`, `comments.ts`, `imports.ts`
- `src/app/api/health/**`, `src/app/api/brands/**`, `src/app/api/campaigns/**`
- `src/components/ui/**` (generated in F0, then frozen)
- `src/app/layout.tsx`, `globals.css` and the placeholder pages/stubs created in F0 belong to Madalin after checkpoint C0.

Never edit Madalin's files (see AGENTS.md). You may import from them: `fetchInstagramSnapshot` (instagram.ts) and `notifyCampaignReady` (notify.ts).

## Rules
1. One task ID at a time; its acceptance criteria are the definition of done.
2. Contracts (`contracts.ts`, migration) change only in a dedicated small PR; tell Fane to announce it.
3. Every LLM output goes through `generateJSON` with a Zod schema and a `usage` tag (metered into `ai_usage`). Numbers (ER, shares, format performance, best hours) are computed in code, never invented by the LLM.
4. Privacy: never send commenter usernames to the LLM; never publish to the main Instagram account.
5. Set `export const maxDuration = 60` on long routes; return errors via `fail()`.
6. No new dependencies beyond BLUEPRINT §2 without asking.
7. Never commit secrets (`.env.local` is gitignored); server keys never get the `NEXT_PUBLIC_` prefix.
8. Verify: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx vitest run` when touching `lib/ml`.
9. Never push, merge or deploy without Fane's approval.
10. Token economy: open only the files the task needs; no broad repo exploration; one complete edit.
11. End with the report format from BLUEPRINT §8.
