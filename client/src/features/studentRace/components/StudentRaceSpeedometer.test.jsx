import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import i18n from "../../../i18n/i18n";
import StudentRaceSpeedometer from "./StudentRaceSpeedometer";

describe("StudentRaceSpeedometer", () => {
  it("renders one readable authoritative multiplier and updates directly from props", () => {
    const { rerender } = render(<StudentRaceSpeedometer speed={0.7} />);

    expect(screen.getByRole("img", {
      name: i18n.t("studentRace:hud.speedValue", { speed: "×0.7" }),
    })).toBeInTheDocument();
    expect(screen.getAllByText("×0.7")).toHaveLength(1);

    rerender(<StudentRaceSpeedometer speed={1.2} />);
    expect(screen.getByText("×1.2")).toBeInTheDocument();
    expect(screen.queryByText("×0.7")).not.toBeInTheDocument();
  });

  it("shows zero but hides absent or invalid speed", () => {
    const { rerender, container } = render(<StudentRaceSpeedometer speed={0} />);
    expect(screen.getByText("×0.0")).toBeInTheDocument();

    rerender(<StudentRaceSpeedometer speed={undefined} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<StudentRaceSpeedometer speed={NaN} />);
    expect(container).toBeEmptyDOMElement();
  });
});
