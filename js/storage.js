// Local storage read/write and goal carry-forward resolution.

const STORAGE_KEYS = {
  entries: "proteinpulse_entries",
  goals: "proteinpulse_goals",
};

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.entries)) || [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.goals)) || [];
  } catch {
    return [];
  }
}

function saveGoals(goals) {
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
}

function generateId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
  } catch {
    // fall through to the manual id below
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayStr() {
  return dateToStr(new Date());
}

function dateToStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Finds the Goal record with the latest effectiveDate that is <= dateStr.
function resolveGoalForDate(dateStr, goals) {
  const applicable = goals
    .filter((goal) => goal.effectiveDate <= dateStr)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  return applicable[0] || null;
}

// Inserts or replaces the goal effective on the given date.
function upsertGoal(effectiveDate, calorieGoal, proteinGoal, goals) {
  const index = goals.findIndex((goal) => goal.effectiveDate === effectiveDate);
  const goal = { effectiveDate, calorieGoal, proteinGoal };
  if (index >= 0) {
    goals[index] = goal;
  } else {
    goals.push(goal);
  }
  return goals;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Sums per-day totals (from `totalsFor`, passed in as `totalsForFn`) across a whole
// calendar month, so the Year view's monthly aggregation shares the exact same
// per-day definition of a "total" as the Today/Week/Month views.
function totalsForMonth(year, month, totalsForFn) {
  const total = { calories: 0, protein: 0 };
  const count = daysInMonth(year, month);
  for (let day = 1; day <= count; day++) {
    const dateStr = dateToStr(new Date(year, month, day));
    const dayTotals = totalsForFn(dateStr);
    total.calories += dayTotals.calories;
    total.protein += dayTotals.protein;
  }
  return total;
}
