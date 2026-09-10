import { Container } from "pixi.js";
import { expect, it, vi } from "vitest";
import { StudentRaceVehicleVisual } from "./StudentRaceVehicleVisual.js";

it("invalidates a pending asset when a pooled visual is reset", async () => {
  let resolve;
  const loadVehicleAssets = vi.fn(() => new Promise((done) => { resolve = done; }));
  const visual = new StudentRaceVehicleVisual(new Container(), { loadVehicleAssets });
  visual.setVehicleAssetKey("TOY_CAR_GREEN");
  visual.reset();
  resolve({ status: "fallback" });
  await Promise.resolve();
  expect(visual.placeholder.visible).toBe(false);
  expect(visual.root.visible).toBe(false);
  expect(visual.requestedVehicleAssetKey).toBeNull();
  visual.destroy();
});

it("resets pooled idle motion and visibility without destroying its reusable root", async () => {
  const visual = new StudentRaceVehicleVisual(new Container(), {
    loadVehicleAssets: async () => ({ status: "fallback" }),
  });
  visual.setVehicleAssetKey("TOY_CAR_GREEN");
  await Promise.resolve();
  const root = visual.root;
  visual.updateIdle({ deltaMs: 100, movementStrength: 1, reducedMotion: false });
  visual.reset();
  expect(visual.root).toBe(root);
  expect(root.destroyed).toBe(false);
  expect(visual.kart.y).toBe(0);
  expect(visual.kart.rotation).toBe(0);
  expect(root.visible).toBe(false);
  visual.destroy();
});
