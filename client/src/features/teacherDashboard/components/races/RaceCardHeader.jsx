import { getTeacherDashboardIcon } from "../../constants/teacherDashboardAssets";
import RaceStatusBadge from "./RaceStatusBadge";

export default function RaceCardHeader({ race, statusLabels }) {
    const flagIcon = getTeacherDashboardIcon("flag");

    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
                {flagIcon && (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50">
                        <img
                            src={flagIcon}
                            alt=""
                            aria-hidden="true"
                            className="h-6 w-6 object-contain"
                        />
                    </span>
                )}

                <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-slate-900">
                        {race.title}
                    </h3>

                    <p className="mt-1 text-sm font-bold text-slate-500">
                        {race.subjectName}
                        {race.subjectCode ? ` · ${race.subjectCode}` : ""}
                    </p>
                </div>
            </div>

            <RaceStatusBadge status={race.status} labels={statusLabels} />
        </div>
    );
}
