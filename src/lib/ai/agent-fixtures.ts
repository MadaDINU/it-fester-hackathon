// Mock outputs for AI_PROVIDER=mock, one per agent op (fictional brand, same as mockIgSnapshot).

const dna = {
  summary: "Short, no-equipment home workouts for parents with little time and a small budget.",
  niche: "20-minute no-gym workouts for busy parents",
  industry: "Fitness creator",
  valueProposition: "Stay strong in 20 minutes a day, at home, for almost no money.",
  toneOfVoice: ["direct", "funny", "honest"],
  doList: ["Give one concrete move or plan", "Answer real follower questions"],
  dontList: ["Promote supplements", "Shame anyone's body"],
  contentPillars: ["Quick workouts", "Pain-free movement", "Budget fitness", "Dad life humour"],
  products: ["Weekly workout plans"],
  targetAudience: "Parents aged 25-44 who train at home",
  colors: ["#7C3AED", "#111827", "#F59E0B"],
  keywords: ["home workout", "no equipment", "busy parents"],
};

const personaDrafts = [
  {
    name: "Andrei, the tired dad",
    ageRange: "35-44",
    gender: "male",
    location: "Bucharest",
    description: "Father of two who trains in the living room before the kids wake up.",
    motivations: ["Keep up with his kids", "Lose his back pain"],
    painPoints: ["Sleeps five hours", "Skips plans that take over 20 minutes"],
    contentTheyLove: ["10-minute routines", "Honest progress stories"],
    preferredFormat: "reel",
    segmentShare: 0.4,
    groundedIn: "M.35-44 and M.25-34 are the largest demographic buckets (mock data)",
  },
  {
    name: "Radu, the budget beginner",
    ageRange: "25-34",
    gender: "male",
    location: "Cluj-Napoca",
    description: "Starting from zero and unwilling to pay for a gym.",
    motivations: ["Build a first routine", "Spend almost nothing"],
    painPoints: ["Unsure about form", "Overwhelmed by plans"],
    contentTheyLove: ["Beginner progressions", "Equipment buying guides"],
    preferredFormat: "carousel",
    segmentShare: 0.3,
    groundedIn: "Comments ask how many sets to do as a beginner (mock data)",
  },
  {
    name: "Ioana, the busy mum",
    ageRange: "25-34",
    gender: "female",
    location: "Timisoara",
    description: "Works full-time and fits movement in between family tasks.",
    motivations: ["Have more energy", "Train with her family"],
    painPoints: ["Small apartment", "No fixed schedule"],
    contentTheyLove: ["Small-space workouts", "Family challenges"],
    preferredFormat: "reel",
    segmentShare: 0.2,
    groundedIn: "F.25-34 and F.35-44 total 28% of followers (mock data)",
  },
  {
    name: "Mihai, the careful returner",
    ageRange: "45-54",
    gender: "male",
    location: "Iasi",
    description: "Coming back to exercise after years off, wary of injury.",
    motivations: ["Move without pain", "Stay independent"],
    painPoints: ["Bad knee", "Most content is too intense"],
    contentTheyLove: ["Physio Q&As", "Mobility routines"],
    preferredFormat: "post",
    segmentShare: 0.1,
    groundedIn: "Comments ask about bad knees and people over 50 (mock data)",
  },
];

// Stable ids so focusGroup can reference personas; F3 maps mock reactions onto real persona ids.
export const MOCK_PERSONA_IDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
  "00000000-0000-4000-8000-000000000004",
];

const reelScript = {
  hook: "Your chair isn't the problem. These 2 muscles are.",
  durationSeconds: 24,
  scenes: [
    { seconds: "0-2", visual: "Creator stands up from a chair, holding his back", onScreenText: "Back pain?", voiceover: "Your chair isn't the problem." },
    { seconds: "2-12", visual: "Glute bridge, side view, slow reps", onScreenText: "Glute bridge x 15", voiceover: "Wake up your glutes first." },
    { seconds: "12-20", visual: "Bird dog on the living room floor", onScreenText: "Bird dog x 10 per side", voiceover: "Then train your deep core." },
    { seconds: "20-24", visual: "Creator points at the camera", onScreenText: "Save this for tonight", voiceover: "Save this and do it tonight." },
  ],
  audioDirection: "Upbeat, clean beat around 120bpm, low under the voiceover",
  coverText: "Fix your back in 5 minutes",
  editingNotes: ["Cut on every rep change", "Add captions for all speech", "Punch in on the hook"],
  tiktokRepurpose: "Open directly on the hook, and ask followers to duet their version.",
};

const baseVariant = {
  hashtags: ["homeworkout", "backpain", "busyparents"],
  suggestedPostHour: 19,
  appliedLearningIds: [],
};

const variants = [
  { ...baseVariant, format: "reel", angle: "Myth-busting back pain", caption: "Your chair isn't the problem. When did your back last feel good?", cta: "Save this for tonight", imageHeadline: "Fix your back in 5 minutes", imagePrompt: "Parent doing a glute bridge in a bright living room", reelScript },
  { ...baseVariant, format: "reel", angle: "Train with your kid", caption: "Toddler on your back: the only weight you already own 😂", cta: "Tag a parent who needs this", imageHeadline: "Your kid is the gym", imagePrompt: "Parent doing squats with a laughing toddler", reelScript: { ...reelScript, hook: "You already own the only weight you need.", coverText: "Your kid is the gym" } },
  { ...baseVariant, format: "post", angle: "The cost comparison", caption: "A dumbbell is €30. A gym is €40 a month. Do the maths.", cta: "Comment your home setup", imageHeadline: "€30 once or €40 a month?", imagePrompt: "A single dumbbell on a wooden floor", reelScript: null },
  { ...baseVariant, format: "post", angle: "The 10-minute rule", caption: "You don't need motivation. You need a 10-minute rule. What's yours?", cta: "Share your rule", imageHeadline: "The 10-minute rule", imagePrompt: "A kitchen timer next to resistance bands", reelScript: null },
];

const REACTION_BASE = [
  { stopScore: 8, sentiment: "positive", quote: "That's exactly my back. I'd watch it to the end.", objection: null },
  { stopScore: 6, sentiment: "neutral", quote: "Useful, but tell me how many sets to do.", objection: "No clear plan for a beginner" },
  { stopScore: 7, sentiment: "positive", quote: "I could do this between two chores.", objection: null },
  { stopScore: 4, sentiment: "negative", quote: "Is this safe with my knee?", objection: "Doesn't mention injuries" },
];

export const agentFixtures: Record<string, unknown> = {
  audienceAnalysis: {
    dna,
    pillarTags: [
      { mediaId: "mock_media_001", pillar: "Quick workouts" },
      { mediaId: "mock_media_002", pillar: "Pain-free movement" },
      { mediaId: "mock_media_007", pillar: "Budget fitness" },
      { mediaId: "mock_media_012", pillar: "Dad life humour" },
    ],
    audienceVoice: {
      topics: ["back pain", "beginner plans", "small spaces"],
      praise: ["Honest, no supplements", "Fits a parent's schedule"],
      complaints: ["Loud music in reels", "Some moves are too fast"],
      questions: ["Is this safe with a bad knee?", "How many sets for a beginner?"],
    },
    personas: personaDrafts,
  },
  brandAnalysis: {
    dna,
    personas: personaDrafts.map((p) => ({ ...p, groundedIn: "website + assumptions" })),
  },
  campaignVariants: { variants },
  focusGroup: {
    reactions: variants.flatMap((_, variantIndex) =>
      MOCK_PERSONA_IDS.map((personaId, p) => ({
        ...REACTION_BASE[p],
        variantIndex,
        personaId,
        stopScore: Math.max(0, REACTION_BASE[p].stopScore - variantIndex),
      })),
    ),
  },
  learningInsights: {
    learnings: [
      { insight: "Reels reach far more people than image posts.", evidence: "Mock data: average reach of about 24,000 for reels and 7,000 for posts.", confidence: "high" },
      { insight: "Captions with a question earn more comments.", evidence: "Mock data: comments are about 9% of likes with a question and 3% without.", confidence: "medium" },
      { insight: "Evening slots match when followers are online.", evidence: "Mock data: online followers peak at 20:00 with 6,200.", confidence: "low" },
    ],
  },
  communityAnalysis: {
    comments: [
      { id: "mock_comment_001", sentiment: "positive", topic: "back pain", isQuestion: false, suggestedReply: "So glad it helped your back! Keep it up." },
      { id: "mock_comment_002", sentiment: "neutral", topic: "injuries", isQuestion: true, suggestedReply: "Go slowly and skip anything that hurts. If the knee is bad, check with a physio first." },
      { id: "mock_comment_003", sentiment: "neutral", topic: "beginner plans", isQuestion: true, suggestedReply: "Start with 2 sets of each move, then add a third when it feels easy." },
    ],
    loyaltyIdeas: [
      { title: "30 days, 30 tiny habits", mechanic: "series", description: "One small daily habit, posted as a numbered series.", why: "Followers already report which day of the plan they're on." },
      { title: "Bad knee Q&A", mechanic: "qna", description: "Answer the most common injury questions with a physio.", why: "Knee questions recur in the comments." },
      { title: "Reply-to-comment reels", mechanic: "reply_reel", description: "Turn one follower question into a reel each week.", why: "It shows followers they are heard." },
    ],
  },
};
