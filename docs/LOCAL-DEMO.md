# Demo local (de pe laptop)

Rulăm build-ul de producție local: e mai rapid și mai stabil decât `npm run dev`. Local nu există limita de 60 s pe rută de pe Vercel, dar nu am schimbat nimic în cod din cauza asta.

> **Atenție:** și local e nevoie de internet, pentru Supabase (baza de date) și Anthropic (agenții AI).

## 1. Ce trebuie să fie în `.env.local`

| Variabilă | Valoare pentru demo |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | obligatorii |
| `AI_PROVIDER` | `anthropic`; `mock` dacă AI-ul cade |
| `ANTHROPIC_API_KEY` | obligatoriu cu `anthropic` |
| `ANTHROPIC_MODEL` / `ANTHROPIC_MODEL_FAST` | `claude-sonnet-5-5` / `claude-haiku-5-5` (implicite) |
| `AI_BUDGET_EUR` | `4`; peste prag, apelurile reale primesc 402 |
| `IG_DATA_MODE` | `live` cu token sau `mock` pentru snapshotul salvat |
| `IG_MAIN_ACCESS_TOKEN`, `IG_MAIN_USER_ID` | tokenul contului și ID-ul contului Instagram (obligatoriu pentru tokenul de system user) |
| `IG_GRAPH_HOST` | `facebook` (graph.facebook.com) |
| `PUBLISH_MODE` | `mock`, ca să nu se publice nimic din greșeală |
| `NEXT_PUBLIC_USE_MOCKS` | `false`. Se aplică la **build**: după orice schimbare rulează din nou `npm run demo:build` |
| `CONTENT_LANGUAGE` | `en` (implicit): tot conținutul generat e în engleză |

`npm run demo:check` verifică aceste variabile fără să le afișeze valorile.

## 2. Pași

```bash
npm install
npm run demo:build
npm run demo:start      # lasă terminalul deschis
npm run demo:check      # în alt terminal: PASS/FAIL și linkurile directe
```

Dimineața, o singură dată, cu tokenul Instagram:

```bash
node --env-file=.env.local --import tsx scripts/ig-probe.ts        # verifică tokenul: host, profil, o postare

node --env-file=.env.local --import tsx scripts/ig-snapshot.ts     # salvează snapshotul real în data/
node --env-file=.env.local --import tsx scripts/prepare-demo.ts    # brand + learnings + campanie + community
```

## 3. Ordinea de click-uri (≈ 3–4 min)

Povestea: **un cont de 134k urmăritori, inactiv, care a pierdut urmăritori, primește un plan de revenire.**

1. **Brand:** importul din Instagram arată că e un cont mare, dar adormit. Prezentăm Audience Intelligence (cine sunt urmăritorii, reels față de postări, orele bune) și cele 4 persona construite din date reale.
2. **Analytics:** istoricul real, modelul antrenat pe acest cont (cu R² spus cinstit), apoi „Run learning loop”. Learnings-urile citează cifre din cont.
3. **Campanie nouă:** goal *followers*, formats *reel + post*, brief „Comeback after inactivity: win back lapsed followers”.
   - Creator-ul scrie variantele, inclusiv storyboard-ul de reel.
   - Focus group-ul reacționează, iar persona-le nu sunt de acord între ele.
   - Predicția ML stabilește câștigătoarea.
   - Arătăm ROI meter-ul și chip-urile „Uses learning” cu ✓ / ✗ verificat de Critic.
4. **Creative + publicare** pe contul de test (mock): mesajul de notificare.
5. **Community:** comentarii reale clasificate, răspunsuri fără promisiuni inventate, o idee de loialitate, apoi „Turn into campaign”.
6. Încheiere: *„Fiecare postare face următoarea mai deșteaptă — pentru o cafenea sau pentru un creator de 134k.”*

## 4. Planuri de rezervă

| Problemă | Ce facem |
|---|---|
| AI lent sau cade | Deschidem campania pregătită de `prepare-demo.ts` (link din `demo:check`); la nevoie `AI_PROVIDER=mock`, cu repornire |
| Instagram cade | `IG_DATA_MODE=mock`: aplicația citește snapshotul real din `data/ig-snapshot.json` |
| Fără internet | Video-ul înregistrat |
| Bugetul AI e atins (402) | Arătăm datele deja generate; nu mărim bugetul în timpul demo-ului |
