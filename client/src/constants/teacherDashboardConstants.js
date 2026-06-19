export const TEACHER_DASHBOARD_STATS = [
    {
        id: "total-races",
        contentKey: "totalRaces",
        iconKey: "flag",
        value: 0,
    },
    {
        id: "active-races",
        contentKey: "activeRaces",
        iconKey: "road",
        value: 0,
    },
    {
        id: "finished-races",
        contentKey: "finishedRaces",
        iconKey: "trophy",
        value: 0,
    },
    {
        id: "waiting-races",
        contentKey: "waitingRaces",
        iconKey: "stopwatch",
        value: 0,
    },
];

export const TEACHER_DASHBOARD_NAV_ITEMS = [
    { key: "dashboard", isActive: true, iconKey: "road" },
    { key: "races", isActive: false, iconKey: "flag" },
    { key: "createRace", isActive: false, iconKey: "pencil" },
    { key: "students", isActive: false, iconKey: "students", isComingSoon: true },
    { key: "subjects", isActive: false, isComingSoon: true },
    { key: "results", isActive: false, iconKey: "trophy", isComingSoon: true },
    { key: "settings", isActive: false, isComingSoon: true },
];
