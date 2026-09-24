import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import TeacherRaceVehicle from "../track/TeacherRaceVehicle";
import { resolveTeacherRaceVehicleAsset } from "../../assets/teacherRaceVehicleManifest";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";

vi.mock("../../assets/teacherRaceVehicleManifest", () => ({
  resolveTeacherRaceVehicleAsset: vi.fn(),
}));

const SIDE_VIEW_URL = "/assets/hover-kart-blue-side.webp";
const ACCENT = "#4285f4";

function renderVehicle(props) {
  const { container } = render(
    <TeacherRaceVehicle vehicleAssetKey="TOY_CAR_BLUE" accentColor={ACCENT} {...props} />,
  );

  return container.querySelector("[data-vehicle-asset-key]");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeacherRaceVehicle", () => {
  it("renders the mapped side-view image as a decorative, non-draggable picture", () => {
    resolveTeacherRaceVehicleAsset.mockReturnValue(SIDE_VIEW_URL);

    const vehicle = renderVehicle();

    expect(resolveTeacherRaceVehicleAsset).toHaveBeenCalledExactlyOnceWith("TOY_CAR_BLUE");
    expect(vehicle.tagName).toBe("IMG");
    expect(vehicle).toHaveAttribute("src", SIDE_VIEW_URL);
    expect(vehicle).toHaveAttribute("alt", "");
    expect(vehicle).toHaveAttribute("aria-hidden", "true");
    expect(vehicle).toHaveAttribute("draggable", "false");
    expect(vehicle).toHaveAttribute("data-vehicle-asset-key", "TOY_CAR_BLUE");
    expect(vehicle.style.backgroundColor).toBe("");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("falls back to the colored marker for an unmapped vehicleAssetKey", () => {
    resolveTeacherRaceVehicleAsset.mockReturnValue(null);

    const vehicle = renderVehicle({ vehicleAssetKey: "TOY_CAR_GOLD" });

    expect(vehicle.tagName).toBe("DIV");
    expect(vehicle).toHaveAttribute("aria-hidden", "true");
    expect(vehicle).toHaveAttribute("data-vehicle-asset-key", "TOY_CAR_GOLD");
    expect(vehicle).toHaveStyle({ backgroundColor: ACCENT });
    expect(vehicle.querySelector("span")).toHaveClass(...S.vehicleCabin.split(" "));
    expect(document.querySelector("img")).toBeNull();
  });

  it("keeps the neutral marker when neither the asset nor the color is known", () => {
    resolveTeacherRaceVehicleAsset.mockReturnValue(null);

    const vehicle = renderVehicle({ accentColor: null });

    expect(vehicle.tagName).toBe("DIV");
    expect(vehicle).toHaveClass(...S.vehicleFallback.split(" "));
    expect(vehicle.style.backgroundColor).toBe("");
  });
});
