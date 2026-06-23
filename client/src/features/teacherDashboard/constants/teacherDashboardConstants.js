export const TEACHER_DASHBOARD_STATS = [
    {
        id: "total-races",
        contentKey: "totalRaces",
        iconName: "Flag",
        value: 0,
    },
    {
        id: "active-races",
        contentKey: "activeRaces",
        iconName: "Gauge",
        value: 0,
    },
    {
        id: "finished-races",
        contentKey: "finishedRaces",
        iconName: "Trophy",
        value: 0,
    },
    {
        id: "waiting-races",
        contentKey: "waitingRaces",
        iconName: "Timer",
        value: 0,
    },
];

export const TEACHER_DASHBOARD_NAV_ACTIONS = Object.freeze({
    DASHBOARD: "dashboard",
    RACES: "races",
    CREATE_RACE: "createRace",
});

export const TEACHER_DASHBOARD_NAV_ITEMS = [
    {
        key: "dashboard",
        actionKey: TEACHER_DASHBOARD_NAV_ACTIONS.DASHBOARD,
        isActive: true,
        iconKey: "road",
    },
    {
        key: "races",
        actionKey: TEACHER_DASHBOARD_NAV_ACTIONS.RACES,
        isActive: false,
        iconKey: "flag",
    },
    {
        key: "createRace",
        actionKey: TEACHER_DASHBOARD_NAV_ACTIONS.CREATE_RACE,
        isActive: false,
        iconKey: "pencil",
    },
    { key: "students", isActive: false, iconKey: "students", isComingSoon: true },
    { key: "subjects", isActive: false, isComingSoon: true },
    { key: "results", isActive: false, iconKey: "trophy", isComingSoon: true },
    { key: "settings", isActive: false, isComingSoon: true },
];



