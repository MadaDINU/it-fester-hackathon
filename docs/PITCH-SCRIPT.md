# Loopwise: script de pitch, runbook demo și întrebări

Public: juriul ITFest × Adobe. Criterii: problemă 25%, inovație AI 25%, tehnic 25%, integrări 15%, demo 10%, bonus cost vs valoare.
Regulă: nu spunem nimic ce nu putem arăta. Unde nu știm, spunem „încă nu știm”.

## 1. Script de pitch (~4 minute)

**Problemă (0:00–0:40)**
- „Instagramul e vitrina oricărei afaceri mici. Reels-urile iau cea mai mare parte din reach.”
- „Un cont real: @ironcladwind, 134.585 de urmăritori. Profilul are 0 postări. În ultimele 30 de zile a pierdut net 921 de urmăritori.” (Surse: Instagram API, 7 nov 2026; Instagram Professional Dashboard, 7 nov 2026.)
- „Audiența e acolo, dar contul tace. Nu e un caz rar: așa arată orice afacere mică fără echipă de marketing.”
- „Întrebarea noastră: cum relansezi un cont când nu ai istoric pe care să-l analizezi?”
- „Unelte AI există. Dar doar generează. Nu își cunosc publicul, nu prezic ce merge și nu învață din rezultate. Generezi și speri.”

**Soluție (0:40–1:20)**
- „Loopwise are cinci agenți AI într-un singur ciclu.”
- „Analystul importă postările reale și antrenează un model de performanță.”
- „Audience construiește patru persona din date reale.”
- „Creatorul scrie variantele, inclusiv storyboard de reel.”
- „Criticul le testează pe persona și cu modelul ML, înainte să postezi.”
- „Community citește comentariile și propune răspunsuri și idei de loialitate.”
- „Fiecare postare face următoarea mai bună.”

**Demo (1:20–2:50): cold start și relansare**
- „Importăm contul real. Nu are nicio postare, dar are 134k de oameni. Din demografia lor reală (bărbați 25–34: 26%, 35–44: 18%; SUA 37%, India 12%) agentul Audience construiește 4 persona și cele 5 piloni de conținut.”
- „Modelul ML e în cold start: pornește de la ponderi prestabilite și învață din primele postări. Nu inventăm un R².”
- „Generăm campania de relansare: primele 3 postări care să trezească audiența.”
- Detaliile pe click în runbook-ul din secțiunea 2.

**Tehnic (2:50–3:20)**
- „Next.js, Supabase cu RLS, Anthropic, Instagram Graph API.” (Discord și Adobe Express le spunem doar dacă sunt gata și le arătăm în demo.)
- „Fiecare răspuns AI e validat cu Zod. Cifrele (rate de engagement, ore bune) le calculează codul, nu modelul.”
- „Predictorul e o regresie ridge scrisă de noi, antrenată pe istoricul contului.”
- „Am măsurat și am optimizat: ruta de campanie a scăzut de la 57 s la 39–44 s. Am mutat Criticul pe Haiku și am trimis Creatorului doar un rezumat al audienței.”

**Cost vs valoare (3:20–3:40)**
- „O campanie costă noi între 0,036 și 0,040 euro. Am măsurat, nu am estimat.”
- „Manual, aceeași muncă înseamnă aproximativ 2 ore. La 20 euro pe oră, circa 40 de euro. Ipoteza e editabilă în aplicație.”
- „ROI meter-ul arată cifrele live din `ai_usage`.”

**Business (3:40–4:00)**
- „Trei planuri: 19, 49 și 149 de euro pe lună.”
- „Următorii pași: publicare TikTok și Facebook, autentificare multi-tenant, A/B automat, optimizare de buget de ads, benchmark cu competitori.”
- Încheiere: „Pentru o cafenea sau pentru un creator de 134k, fiecare postare face următoarea mai deșteaptă.”

## 2. Runbook demo

**Înainte:** `npm run demo:build`, `npm run demo:start` (terminal deschis), apoi `npm run demo:check`. Dacă e PASS, notăm linkul campaniei pregătite.

**Campania de rezervă:** creată de `scripts/prepare-demo.ts` (brand, learnings, campanie, community). Linkul direct e tipărit de `npm run demo:check`. Îl ținem deschis într-un tab separat.

| # | Click | Ce spunem |
|---|---|---|
| 1 | **Brand** | „Importul arată un cont mare, dar adormit.” Arătăm cine sunt urmăritorii, reels față de postări, orele bune. „Cele 4 persona vin din date reale; fiecare are `groundedIn`.” |
| 2 | **Analytics** | „Cold start: modelul pornește de la ponderi prestabilite și învață din primele postări.” Dacă am rulat `seed-history.ts`: „Pentru demo am adăugat 30 de postări **simulate**, etichetate «seeded», ca să vedeți bucla de învățare.” Click pe „Run learning loop”. |
| 3 | **Campanie nouă**: goal *followers*, formats *reel + post*, brief „Relaunch: first 3 posts to re-engage 134k dormant followers” | Vezi narațiunea de mai jos. Pe laptop durează ~50 s. |
| 4 | **Creative + publicare** (mock, pe contul de test) | „Nu publicăm niciodată pe contul principal din greșeală.” Arătăm mesajul de notificare. |
| 5 | **Community** | Comentarii reale clasificate, răspunsuri fără promisiuni inventate, o idee de loialitate. Click „Turn into campaign”. |
| 6 | Încheiere | Fraza finală din secțiunea 1. |

**Ce spunem în cele ~40 s cât se generează campania**
1. 0–15 s, Creator: „Creatorul scrie variantele pe baza brandului, persona și ultimelor learnings. Fiecare reel are hook, scene, text pe ecran, note de editare și o notă pentru TikTok.”
2. 15–30 s, focus group: „Acum fiecare persona reacționează la fiecare variantă, într-un singur apel. O să vedeți că nu sunt de acord între ele.”
3. 30–40 s, predicția ML: „Modelul estimează engagement-ul fiecărei variante. Rangul final e jumătate scor de panel, jumătate predicție.”
4. La final: arătăm câștigătoarea, ROI meter-ul și chip-urile „Uses learning” cu ✓ / ✗ verificat de Critic.

**Planuri de rezervă (LOCAL-DEMO.md, secțiunea 4)**

| Problemă | Acțiune |
|---|---|
| AI lent sau cade | Deschidem campania pregătită (link din `demo:check`). La nevoie `AI_PROVIDER=mock`, cu repornire. |
| Instagram cade | `IG_DATA_MODE=mock`: aplicația citește `data/ig-snapshot.json`. |
| Fără internet | Video-ul înregistrat. |
| Buget AI atins (402) | Arătăm datele deja generate. Nu mărim bugetul în timpul demo-ului. |

**Ce spunem dacă ceva pică, pe pași**

Linkuri pregătite (brand @ironcladwind, deja importat):
- Brand: http://localhost:3000/brands/cb86e39b-2a6c-439e-8523-c3436354d665
- Campania pregătită: http://localhost:3000/campaigns/c7c14e83-5edc-494c-a401-80027e94749a
- Analytics / Community: linkul de brand + `/analytics` / `/community`

Orice schimbare de variabilă se face în `.env.local`, apoi Ctrl+C pe `demo:start` și `npm run demo:start` din nou (fără rebuild, ~5 s).

| Pas | Ce pică | Ce spunem | Ce facem |
|---|---|---|---|
| 1 Brand | Instagram API nu răspunde (eroare 502 la „Refresh data”) | „API-ul Meta are o problemă acum; datele importate azi sunt deja în aplicație.” | Nu reimportăm. Deschidem linkul de brand. Dacă trebuie arătat importul: `IG_DATA_MODE=mock` (citește `data/ig-snapshot.json` dacă l-am salvat dimineața cu `ig-snapshot.ts`, altfel datele demo, nu cele reale) și repornim. |
| 2 Analytics | „Run learning loop” durează sau dă eroare | „Modelul s-a antrenat deja; vă arăt learnings-urile de mai devreme.” | Rămânem pe Analytics și pe Brand Memory: learnings-urile sunt deja salvate și etichetate „[Simulated history]”. |
| 3 Campanie | Generarea trece de ~60 s sau dă „Request timed out” / 502 | „Creatorul scrie 4 variante cu script complet de reel; ca să nu vă ținem, vă arăt una generată azi pe același cont.” | Deschidem linkul campaniei pregătite. Verificăm înainte că `AI_TIMEOUT_MS=110000` e în `.env.local`. Dacă Anthropic e căzut: `AI_PROVIDER=mock`, repornim; spunem că restul demo-ului folosește date generate mai devreme. |
| 3 Campanie | Eroare 402 „budget_exceeded” | „Avem un plafon de cost pe AI: aplicația se oprește singură înainte să depășească bugetul. Asta e partea de cost control.” | Deschidem campania pregătită. Nu mărim `AI_BUDGET_EUR` pe scenă. |
| 4 Publicare | Publish sau Simulate sunt blocate în UI („require M6b/M7”) | „Publicarea e intenționat pe mock: nu postăm nimic pe contul real de 134k în demo. Pentru contul principal e nevoie de confirmare explicită.” | Sărim peste click; arătăm dialogul de confirmare pentru contul principal, dacă e activ, și trecem la Community. |
| 5 Community | „Run Community agent” dă eroare | „Contul nu are încă comentarii; ideile de loialitate sunt deja generate din audiență.” | Arătăm cele 3 idei de loialitate deja salvate. |
| Oricare | Fără internet (Supabase și Anthropic au nevoie de rețea) | „Vă arătăm înregistrarea.” | Pornim video-ul de rezervă. |

## 3. Întrebări probabile din partea juriului

1. **De ce nu folosim direct ChatGPT?** Un chat generează text generic. Loopwise își ia datele din contul real, testează variantele pe persona și pe un model antrenat pe istoricul contului, apoi învață din rezultate. Un chat nu face ciclul ăsta singur.
2. **Cât de precis e modelul?** R² pe contul real: TBD, îl completăm după rulare. R² e în-sample, pe log(ER). Cifra 0,83 de pe date mock nu e un rezultat și nu o folosim. Conturile mici au puține postări, deci puține exemple. Sub 8 postări cu insights, modelul folosește ponderi prestabilite.
3. **Confidențialitatea datelor?** Folosim doar tokenul proprietarului contului. Nu facem scraping pe Instagram. LLM-ul primește doar textul comentariilor, fără username-uri. Baza de date are RLS activ, fără policy-uri, accesată doar de server. Publicăm implicit pe un cont de test.
4. **Ce e real și ce e simulat?** Metricile importate sunt reale. Ruta de simulare și seed-ul sunt etichetate `simulated` sau `seeded`, niciodată `live`. Importurile mock se salvează ca `seeded`.
5. **Scalare și multi-tenant?** Azi există un singur workspace și nu avem autentificare. Asta e o limită reală. Roadmap: autentificare plus policy-uri RLS per tenant.
6. **Cost la 1.000 de clienți?** Calcul, cu ipoteze marcate.
   - Ipoteză A: toți pe Starter (20 campanii) la costul măsurat de ~€0,04 pe campanie.
   - AI: 20 × 0,04 = €0,80 pe client pe lună, deci €800 la 1.000 de clienți.
   - Infra: ~€1 pe client, estimare din BLUEPRINT §11.3, nemăsurată la această scară. Total ~€1.800.
   - Venit: 1.000 × €19 = €19.000, marjă brută peste 90%.
   - Ipoteză B: toți pe Growth (40 campanii). 40 × 0,04 = €1,60, plus rulări de learning (€0,016) și community (€0,0012) pe care nu le-am numărat. Marjă peste 85% conform BLUEPRINT.
   - Nu am testat încărcarea la 1.000 de clienți.
7. **TikTok?** Nu e implementat. Scripturile de reel includ o notă de repurposing pentru TikTok. Publicarea prin API e pe roadmap.
8. **Diferența față de Later, Buffer, Hootsuite?** Din ce știm noi, acestea programează și raportează. Loopwise generează, pre-testează pe persona și pe model, și învață din rezultate. Nu comparăm funcție cu funcție.
9. **De ce sunt credibile persona sintetice?** Sunt construite din demografia, comentariile și postările reale ale contului, iar fiecare citează `groundedIn`. Sunt un filtru înainte de postare, nu un înlocuitor pentru rezultate reale. Ciclul de învățare le corectează după ce apar metricile.
10. **Ce se întâmplă când Meta schimbă API-ul?** Folosim endpoint-uri cu versiune (v27.0), cu câmpuri verificate în documentația oficială. Avem fallback-uri pentru câmpuri lipsă și mod mock cu snapshot salvat. Dacă Meta schimbă ceva, trebuie să actualizăm clientul.
11. **Cum câștigați bani?** Starter €19 pe lună (1 cont, 20 campanii). Growth €49 (3 conturi, agent Community, learning loop). Agency €149 (conturi nelimitate, rapoarte pentru clienți).
12. **Ce faceți cu încă o lună?** Doar din roadmap (BLUEPRINT §10, slide 6): publicare TikTok și Facebook, autentificare multi-tenant, A/B automat, optimizare de buget de ads, benchmark cu competitori.

## 4. Cifre de completat după rularea live

Toate rămân TBD până le măsurăm pe contul real. Nu le spunem pe scenă până nu sunt completate.

- [x] Urmăritori: **134.585** (Instagram API, 7 nov 2026)
- [x] Postări importate: **0** (profil gol), deci fără insights pe postări și fără comentarii
- [x] Pierdere netă: **−921 urmăritori în 30 de zile** (Instagram Professional Dashboard, 7 nov 2026)
- [x] Demografie reală: da. Top: M 25–34 **26,0%**, M 35–44 **18,2%**, M 45–54 **8,1%**; țări: SUA **36,7%**, India **11,6%**, Marea Britanie **4,6%**
- [x] R² real: **nu există** (cold start, 0 eșantioane; model cu ponderi prestabilite). Nu spunem o cifră.
- [x] `formatPerformance`: gol (fără postări)
- [x] Cost import + audiență pe contul real: **€0,026**, 20,5 s
- [x] Cost campanie pe contul real: **€0,050** (Creator 41 s + focus group 10 s, ruta 52 s pe laptop)
- [ ] Cheltuială AI totală: TBD la final (la 7 nov, ~€0,41 înregistrat + estimat)
- [ ] Dacă rulăm `seed-history.ts`: R² și learnings pe date **simulate**; le prezentăm doar ca demonstrație a buclei

## 5. Slide de transparență: real și simulat în demo

| Element | Real sau simulat | Sursă |
|---|---|---|
| Urmăritori (134.585) și postări (0) | **Real** | Instagram API, 7 nov 2026 |
| Pierdere netă de −921 în 30 de zile | **Real** | Instagram Professional Dashboard |
| Demografie (vârstă, gen, țări, orașe) | **Real** | `follower_demographics` |
| Nișa și pilonii de conținut | **Generat de AI** | din profilul real, demografie și descrierea nișei |
| Cele 4 persona | **Generat de AI**, bazat pe date reale | citează procentele reale |
| Campania „Relaunch” și reacțiile focus group-ului | **Generat de AI** | Sonnet 5.5 + Haiku 5.5 |
| Predicția ER per variantă | **Model**, ponderi învățate pe date simulate | se va reantrena pe postări reale |
| Istoricul de 30 de postări și metricile lor | **Simulat** | `seed-history.ts`, etichetat `seeded` |
| R² 0,89 și cele 5 learnings | **Din date simulate** | demonstrează bucla, nu performanța contului |
| Publish și Simulate | **Mock** | nu se publică nimic pe Instagram |
| Comentarii | **Nu există** | contul nu are postări |
