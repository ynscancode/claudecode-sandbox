// Default daily spending budget used to seed the "Daily insights" panel on
// the Overview page (spent today / daily average / projected month) the
// first time a user visits, before they've set or cleared anything. The
// user-editable value itself lives in localStorage (see
// hooks/useDailyBudget.js) — there's no dailyBudget concept in the backend
// data model, and this stays a client-only, Overview-only setting.
export const DEFAULT_DAILY_BUDGET = 50;
