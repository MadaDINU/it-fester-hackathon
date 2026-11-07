# Loopwise: conținut pentru slide-uri

Pentru Madalin (deck). Cifrele sunt măsurate pe 7 nov 2026. Ce nu e confirmat e marcat explicit.

## 1. Problema: audiență mare, cont tăcut
- @ironcladwind: **134.585 de urmăritori**, **0 postări** pe profil (Instagram API, 7 nov 2026).
- **−921 de urmăritori net în 30 de zile** (Instagram Professional Dashboard).
- Afacerile mici au aceeași problemă: audiența există, dar nu au timp, echipă sau date ca să posteze ce merge.
- Uneltele AI de azi doar generează: nu cunosc publicul, nu prezic, nu învață.

## 2. Soluția: 5 agenți AI într-o buclă
- **Analyst:** importă contul și antrenează un model de performanță pe istoricul lui.
- **Audience:** 4 persona construite din demografia reală (bărbați 25–34: 26%, 35–44: 18%; SUA 37%, India 12%).
- **Creator + Critic:** variante de postări și reels, testate pe un focus group sintetic și pe model înainte de publicare.
- **Community:** idei de loialitate acum; răspunsuri la comentarii de la primele comentarii.

## 3. Demo: relansarea unui cont de 134k
- **Actul 1, real:** import live, persona reale, campania „Relaunch: first 3 posts to re-engage 134k dormant followers”.
- Focus group-ul de 4 persona reacționează; modelul estimează engagement-ul; câștigătoarea e un reel.
- Notificare pe **Discord** pentru aprobare umană: AI-ul nu postează singur.
- Creativul se editează în **Adobe Express** și se salvează înapoi în campanie.
- **3 integrări terțe reale:** Instagram Graph API (live), Discord, Adobe Express.
- **Actul 2, simulat și declarat:** „după prima lună” (30 de postări simulate), cu R² 0,89 și learnings cu badge.

## 4. Sub capotă
- Diagrama de arhitectură: `docs/BLUEPRINT.md` §2 (Next.js → API → agenți → Anthropic / ML / Supabase / Instagram / Discord).
- **Rutare între modele:** Sonnet 5.5 scrie (Creator), Haiku 5.5 evaluează (Critic, Community). Campania a scăzut de la 57 s la 39–52 s.
- **Buget în cod:** fiecare apel AI e contorizat; peste plafon, aplicația răspunde 402 în loc să cheltuie.
- Fiecare răspuns AI e validat (Zod); cifrele le calculează codul, nu modelul. **162 de teste automate.**

## 5. Cost vs valoare (măsurat)
- Brand nou (import + audiență): **~€0,026**. Campanie (4 variante + focus group): **~€0,04–0,05**.
- **~€0,01 per post variant** (campaign cost ÷ variants). Learning loop: **~€0,013**. Community: **~€0,001**.
- Tot hackathonul, cu toate testele pe AI real: **~€0,58** (€0,33 contorizat + ~€0,25 înainte de contorizare).
- Valoare: ~2 h de muncă manuală per campanie, adică ~€40 la €20/h (ipoteză editabilă în aplicație).

## 6. Transparență: ce e real și ce e simulat
| Element | Statut |
|---|---|
| Urmăritori, 0 postări, −921/30 zile, demografie | **Real** |
| Persona, nișă, campanie, idei de loialitate | **Generat de AI** din datele reale |
| Notificarea Discord | **Real** (livrare confirmată) |
| Istoricul de 30 de postări, R² 0,89, learnings | **Simulat**, etichetat în aplicație |
| Publicare pe Instagram | **Mock**: nu postăm pe contul real |
| Editare în Adobe Express | **Real** (confirmat pe producție) |

## 7. Business și roadmap
- **Starter €19/lună**, **Growth €49/lună**, **Max €149/lună**.
- La ~€0,05 pe campanie, costul AI e o fracțiune mică din abonament.
- **Roadmap:** Connect Instagram prin OAuth; Approve direct din Discord; TikTok; A/B auto-posting.

## 8. Cum răspundem criteriilor
| Criteriu | Pondere | Ce arătăm |
|---|---|---|
| Problemă | 25% | Cont real de 134k, 0 postări, −921 urmăritori în 30 de zile |
| Inovație AI | 25% | 5 agenți, focus group sintetic, model antrenat pe cont, buclă de învățare |
| Tehnic | 25% | Rutare Sonnet/Haiku, validare Zod, buget în cod, 162 de teste, Supabase cu RLS |
| Integrări | 15% | 3 integrări terțe reale: Instagram Graph API (live), Discord, Adobe Express |
| Demo | 10% | Demo live pe contul real, cu planuri de rezervă |
| Bonus cost vs valoare | +10% | ~€0,05 per campanie, măsurat; ~€0,58 tot hackathonul |
