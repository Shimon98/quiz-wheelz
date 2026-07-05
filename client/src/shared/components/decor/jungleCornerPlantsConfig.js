/*
 * Placement ids for JungleCornerPlants — LOGICAL positions (start/end) so a
 * composition mirrors as a whole with the <html> dir. Kept outside the
 * component file so shells/configs can import them without breaking the
 * react-refresh only-export-components rule.
 */
export const PLANT_PLACEMENTS = Object.freeze({
  TOP_START: "top-start",
  TOP_END: "top-end",
  BOTTOM_START: "bottom-start",
  BOTTOM_END: "bottom-end",
  GROUND_STRIP: "ground-strip",
});
