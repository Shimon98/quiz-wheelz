import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../../i18n/i18n";
import { I18N_NAMESPACES } from "../../../../../i18n/i18nConstants";
import { TEACHER_FEED_KINDS, TEACHER_FEED_PRESENTATION } from "../../../config/teacherLiveFeedConfig";
import TeacherLiveEventItem from "../TeacherLiveEventItem";

const MUD_ROW = Object.freeze({
  id: "21:LUCK_MUD:3", kind: TEACHER_FEED_KINDS.LUCK_MUD, messageKey: "feed.luckMud", values: { name: "Noa" },
});

function renderRow(item = MUD_ROW) {
  render(
    <MantineProvider>
      <ul>
        <TeacherLiveEventItem item={item} relativeLabel="now" />
      </ul>
    </MantineProvider>,
  );
  return screen.getByRole("listitem");
}

describe("TeacherLiveEventItem", () => {
  it("shows the moment's painting in the 28 px slot, in place of the tinted circle", () => {
    const row = renderRow();
    const art = row.querySelector("img");

    expect(art).toHaveAttribute("src", TEACHER_FEED_PRESENTATION[TEACHER_FEED_KINDS.LUCK_MUD].art);
    expect(art).toHaveAttribute("alt", "");
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(art).toHaveClass("size-7");
    expect(row.querySelector("svg")).toBeNull();
    expect(row).toHaveTextContent(i18n.t(`${I18N_NAMESPACES.TEACHER_LIVE_RACE}:feed.luckMud`, { name: "Noa" }));
  });

  it("brings back today's tinted circle with its line icon when the painting does not load", () => {
    const row = renderRow();

    fireEvent.error(row.querySelector("img"));

    expect(row.querySelector("img")).toBeNull();
    expect(row.querySelector(".mantine-ThemeIcon-root svg.lucide-droplets")).not.toBeNull();
  });
});
