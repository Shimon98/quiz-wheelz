import { Container, Texture } from "pixi.js";
import { expect, it, vi } from "vitest";
import { StudentRaceVehicleVisual } from "../StudentRaceVehicleVisual.js";
import { STUDENT_RACE_VEHICLE_MANIFEST } from "../../assets/studentRaceVehicleManifest.js";

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

it("resolves every server color to its own static asset with identical geometry and no runtime filters", async () => {
  const visuals = [];
  for (const [key, definition] of Object.entries(STUDENT_RACE_VEHICLE_MANIFEST)) {
    expect(definition.idleFrames[0]).toContain(`hover-kart-${key.replace("TOY_CAR_", "").toLowerCase()}-idle-01.webp`);
    expect([definition.anchorX, definition.anchorY, definition.baseScale]).toEqual([0.5, 0.96, 1.08]);
    const visual = new StudentRaceVehicleVisual(new Container(), {
      loadVehicleAssets: async () => ({ status: "loaded", definition, textures: [Texture.WHITE] }),
    });
    visuals.push(visual);
    visual.setVehicleAssetKey(key);
    await Promise.resolve();
    expect(visual.artSprite.texture).toBe(Texture.WHITE);
    expect(visual.artSprite.filters ?? []).toHaveLength(0);
    expect(visual.root.filters ?? []).toHaveLength(0);
  }
  expect(new Set(Object.values(STUDENT_RACE_VEHICLE_MANIFEST).map((definition) => definition.idleFrames[0])).size).toBe(8);
  const colored = visuals.at(-1);
  colored.reset();
  expect(colored.artSprite).toBeNull();
  visuals.forEach((visual) => visual.destroy());
  expect(Texture.WHITE.destroyed).toBe(false);
});
