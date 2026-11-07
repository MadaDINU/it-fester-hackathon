const PREFIX = "[Simulated history]";
export const isSimulatedSource = (source: string) => source === "seeded" || source === "simulated";
export const isSimulatedTraining = (trainedOn: string) => trainedOn === "seeded" || trainedOn === "mixed";
export const isSimulatedLearning = (text: string) => text.trimStart().startsWith(PREFIX);
export const stripSimulatedPrefix = (text: string) => isSimulatedLearning(text) ? text.trimStart().slice(PREFIX.length).trimStart() : text;
