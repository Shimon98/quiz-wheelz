import { cx } from "../../../../utils/classNameUtils";
import { resolveTeacherRaceVehicleAsset } from "../../assets/teacherRaceVehicleManifest";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";

export default function TeacherRaceVehicle({ accentColor, vehicleAssetKey }) {
  const sideViewAsset = resolveTeacherRaceVehicleAsset(vehicleAssetKey);

  if (sideViewAsset) {
    return (
      <img
        className={S.vehicleImage}
        src={sideViewAsset}
        alt=""
        aria-hidden="true"
        draggable={false}
        data-vehicle-asset-key={vehicleAssetKey}
      />
    );
  }

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
