// All interface text, in Romanian. AI-generated content is shown as it arrives and is not translated.
// Pitch labels that changed from English are listed in GLOSAR-PITCH.md.

export const copy = {
  app: { name: "Loopwise", workspace: "Spațiu de lucru demo", skip: "Sari la conținut", demoBanner: "Spațiu de lucru demo · Date de exemplu. Acțiunile nu publică și nu salvează nimic." },

  nav: {
    label: "Navigație principală",
    home: "Acasă", audience: "Audiență", campaigns: "Campanii", analytics: "Analize", community: "Comunitate",
    brands: "Branduri", newBrand: "Conectează un brand", newCampaign: "Campanie nouă", studio: "Studio campanie",
    help: "Ajutor", collapse: "Restrânge meniul", expand: "Extinde meniul", openMenu: "Deschide meniul", closeMenu: "Închide meniul", menuTitle: "Meniu",
  },

  brandSwitcher: {
    label: (name: string) => `Schimbă brandul, brand curent: ${name}`,
    caption: "Brand", current: "Curent", none: "Niciun brand", noneHint: "Conectează un brand ca să începi",
    followers: (n: number) => `${n.toLocaleString("ro-RO")} urmăritori`, noInstagram: "Fără Instagram",
  },

  topbar: { themeToLight: "Comută la tema luminoasă", themeToDark: "Comută la tema întunecată" },

  notifications: {
    label: (n: number) => n ? `Notificări, ${n} necitite` : "Notificări",
    title: "Notificări", markRead: "Marchează ca citite", empty: "Nicio notificare deocamdată. Îți spunem aici când o campanie e gata sau apare o lecție nouă.",
    loading: "Se încarcă notificările…", unavailable: "Notificările nu sunt disponibile acum.",
    campaignReady: (brief: string) => `Campania e gata: ${brief}`,
    campaignFailed: (brief: string) => `Campania a eșuat: ${brief}`,
    learning: (insight: string) => `Lecție nouă: ${insight}`,
    comments: (n: number) => n === 1 ? "Un comentariu nou fără răspuns" : `${n} comentarii noi fără răspuns`,
  },

  profile: { label: "Meniul profilului", name: "Mădălin", workspace: "Spațiu de lucru demo", settings: "Setări", help: "Ajutor" },

  settings: {
    title: "Setări", description: "Preferințele se salvează doar în acest browser.",
    theme: "Temă", light: "Luminoasă", dark: "Întunecată",
  },

  help: {
    title: "Cum funcționează Loopwise",
    description: "Fiecare campanie trece prin aceeași buclă. Pagina Acasă îți arată unde ești și ce urmează.",
    steps: [
      ["Importă contul", "Loopwise citește postările și rezultatele de pe Instagram."],
      ["Vezi audiența", "Afli cine te urmărește și la ce reacționează."],
      ["Creează campania", "AI-ul scrie mai multe idei, iar un focus grup al audienței le dă note."],
      ["Publică", "Postezi ideea recomandată pe contul de test."],
      ["Simulează", "Generezi rezultate pentru postarea de test, ca să închizi bucla în demo."],
      ["Rulează bucla de învățare", "Modelul compară predicția cu rezultatul și păstrează ce a învățat."],
    ] as const,
    terms: "Termeni",
  },

  states: {
    errorTitle: "Ceva n-a mers", retry: "Încearcă din nou", loading: "Se încarcă…", loadingWorkspace: "Se încarcă spațiul de lucru…",
  },

  status: { generating: "Se generează", ready: "Gata de publicat", published: "Publicată", failed: "Eșuată" },

  loop: {
    brand: { import: "Importă contul", audience: "Vezi audiența", campaign: "Creează campania", publish: "Publică", simulate: "Simulează", learn: "Rulează bucla de învățare" },
    studio: { generated: "Generată", creative: "Creativ", published: "Publicată", simulated: "Simulată", learned: "Învățată" },
    done: " (gata)", current: " (pasul curent)",
  },

  simulated: "Istoric simulat",

  glossary: {
    er: { term: "Rata de engagement", text: "Aprecieri, comentarii, distribuiri și salvări împărțite la oamenii care au văzut postarea. Cu cât e mai mare, cu atât mai mulți au reacționat." },
    predictedEr: { term: "ER prezis", text: "Estimarea noastră pentru rata de engagement a postării, pe baza postărilor tale de până acum. E o prognoză, nu o garanție." },
    panelScore: { term: "Scorul panelului", text: "Cât de tare ar spune personas-urile audienței tale că se opresc și reacționează, de la 0 la 100." },
    r2: { term: "R²", text: "Cât de bine explică modelul rezultatele tale de până acum, de la 0 la 1. Cu cât e mai aproape de 1, cu atât predicțiile sunt mai sigure." },
    coldStart: { term: "Pornire la rece", text: "Încă nu sunt destule postări pentru antrenare, așa că predicțiile folosesc tipare generale. Se îmbunătățește după aproximativ 8 postări măsurate." },
    simulated: { term: "Istoric simulat", text: "Date de demo care imită rezultate reale și sunt marcate clar. Nu provin din postările reale ale contului." },
    focusGroup: { term: "Focus grup", text: "Personas AI construite din audiența ta reacționează la fiecare idee înainte să postezi, ca ideile slabe să iasă la iveală devreme." },
    whatIs: (term: string) => `Ce înseamnă ${term}?`,
  },

  // Pitch labels (old English label in GLOSAR-PITCH.md).
  pitch: {
    runLearningLoop: "Rulează bucla de învățare",
    turnIntoCampaign: "Transformă în campanie",
    simulatedHistory: "Istoric simulat",
    usesLearning: "Aplică o lecție",
    createAndTest: "Creează și testează campania",
    recommended: "Recomandată",
    editInAdobe: "Editează în Adobe Express",
  },
} as const;

export const relativeTime = (iso: string, now = Date.now()) => {
  const minutes = Math.round((new Date(iso).getTime() - now) / 60000);
  const rtf = new Intl.RelativeTimeFormat("ro", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
};
