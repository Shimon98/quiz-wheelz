import { cx } from "../../../../utils/classNameUtils";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";

export default function TeacherRaceVehicle({ accentColor, vehicleAssetKey }) {
  return (
    <div
      className={cx(S.vehicle, !accentColor && S.vehicleFallback)}
      style={accentColor ? { backgroundColor: accentColor } : undefined}
      data-vehicle-asset-key={vehicleAssetKey}
      aria-hidden="true"
    >
      <span className={S.vehicleCabin} />
    </div>
  );
}
