# Video de rezervă: checklist (înregistrare la 18:00)

Durată țintă: **2–3 minute**. Îl folosim doar dacă demo-ul live pică (fără internet sau aplicația nu răspunde).

## Înainte de înregistrare
- [ ] `npm run demo:build`, `npm run demo:start`, `npm run demo:check` → **READY**.
- [ ] `BASE_URL=http://localhost:3000 node --env-file=.env.local --import tsx scripts/rehearsal-check.ts` → **ALL PASSED**.
- [ ] Browser în modul de prezentare, zoom 110–125%, fără extensii vizibile, notificările sistemului oprite.
- [ ] Tab-uri deschise, în ordine: Brand, Studio (campania „Relaunch”), Analytics, Community, Discord.
- [ ] Microfon testat; cameră opțională.

## Ordinea ecranelor și ce spunem
| # | Ecran | Timp | Ce spunem |
|---|---|---|---|
| 1 | Brand @ironcladwind | 0:00–0:25 | „Cont real: 134.585 de urmăritori, 0 postări, −921 de urmăritori în 30 de zile. Din demografia reală, Loopwise construiește 4 persona.” |
| 2 | Campanie nouă (3 variante) | 0:25–1:15 | Generăm live; în timp ce se încarcă: Creator → focus group → predicție. La final arătăm câștigătoarea și storyboard-ul de reel. Dacă durează prea mult, tăiem la campania pregătită. |
| 3 | Discord | 1:15–1:30 | „Echipa primește notificarea și aprobă; AI-ul nu postează singur.” |
| 4 | Community | 1:30–1:50 | „Fără comentarii încă: idei de loialitate din audiență.” |
| 5 | Analytics | 1:50–2:30 | „Actul 2, simulat și declarat: o lună de postări simulate, R² 0,89, learnings cu cifre. Badge-ul «Simulated history» arată ce nu e real.” |
| 6 | Încheiere | 2:30–2:45 | „Fiecare postare face următoarea mai deșteaptă.” |

## Înregistrare și salvare
- Windows: **Win + Alt + R** (Xbox Game Bar) sau OBS; 1080p, 30 fps.
- Salvăm ca `loopwise-demo-backup.mp4` în **două** locuri: pe desktopul laptopului de prezentare și pe un stick USB (sau Google Drive partajat cu echipa).
- Verificăm că se redă cap-coadă, cu sunet, înainte de 18:30.
- **Nu** punem video-ul în repo (fișier mare).
