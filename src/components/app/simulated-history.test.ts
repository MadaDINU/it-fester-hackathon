import { expect, it } from "vitest";
import { isSimulatedLearning, isSimulatedSource, isSimulatedTraining, stripSimulatedPrefix } from "./simulated-history";

it("flags seeded/simulated sources and seeded/mixed training, not live", () => {
  expect(["seeded", "simulated", "live"].map(isSimulatedSource)).toEqual([true, true, false]);
  expect(["seeded", "mixed", "live"].map(isSimulatedTraining)).toEqual([true, true, false]);
});
it("detects and strips the [Simulated history] learning prefix only at the start", () => {
  expect(isSimulatedLearning("[Simulated history] Mock data: reach 24k")).toBe(true);
  expect(stripSimulatedPrefix("[Simulated history] Mock data: reach 24k")).toBe("Mock data: reach 24k");
  expect(isSimulatedLearning("Reels mention [Simulated history] later")).toBe(false);
  expect(stripSimulatedPrefix("Real insight")).toBe("Real insight");
});
