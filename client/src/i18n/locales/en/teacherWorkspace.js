/*
 * English strings for the teacher workspace (teacherWorkspace namespace) —
 * mirrors locales/he/teacherWorkspace.js key-for-key.
 */
export default {
  nav: {
    menu: "Menu",
    dashboard: "Dashboard",
    races: "Races",
    settings: "Settings",
    logout: "Log out",
    comingSoon: "Soon",
  },
  profile: {
    role: "Teacher",
  },
  greeting: {
    title: "Hello, {{name}}!",
    titleNoName: "Hello!",
    subtitle: "All of your races, at a glance.",
  },
  actions: {
    createRace: "Create a new race",
    createRaceSoonTitle: "Almost there!",
    createRaceSoonBody: "Creating races from the new dashboard is coming very soon.",
    viewAllRaces: "View all races",
  },
  stats: {
    active: "Active races",
    waiting: "Waiting races",
    cancelled: "Cancelled races",
    total: "Total races",
  },
  races: {
    title: "My races",
    columns: {
      name: "Race name",
      subject: "Subject",
      players: "Players",
      status: "Status",
      roomCode: "Room code",
      createdAt: "Created at",
    },
    open: "Open race",
    copyRoomCode: "Copy room code",
    copied: "Copied!",
  },
  raceStatus: {
    waiting: "Waiting",
    ready: "Ready",
    active: "Live",
    finished: "Finished",
    cancelled: "Cancelled",
    unknown: "Unknown",
  },
  states: {
    loading: "Loading your dashboard...",
    errorTitle: "Something went wrong",
    errorBody: "We couldn't load the dashboard. Please try again in a moment.",
    retry: "Try again",
    emptyTitle: "No races yet",
    emptyBody: "Create your first race and bring the jungle to life!",
  },
};
