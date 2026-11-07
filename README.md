# Loopwise

**Predict before you post. Learn after you post.** AI growth agents for social media, built on real Instagram data. Next.js 15, TypeScript, Supabase and Vercel.

The full spec is in [docs/BLUEPRINT.md](docs/BLUEPRINT.md). Assistant instructions are in [CLAUDE.md](CLAUDE.md) (Fane) and [AGENTS.md](AGENTS.md) (Madalin). File ownership is in BLUEPRINT §3.

## Setup

Requires Node 22 or newer.

```bash
npm install
cp .env.example .env.local   # real values are shared privately, never through Git
npm run dev
```

Check that it works at <http://localhost:3000/api/health>.

Without any env values, the app runs in safe mock modes (`AI_PROVIDER`, `IG_DATA_MODE` and `PUBLISH_MODE` default to `mock`), and `/api/health` reports `db: false`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `npm run build` | Production build |
| `npm test` | Unit tests (vitest) |

## UI components

`src/components/ui` uses the shadcn `base-nova` style, built on Base UI rather than Radix. Compose triggers with the `render` prop instead of `asChild`.

## Database

The schema is in [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql). RLS is on with no policies: only the server accesses data, using the service role key.
