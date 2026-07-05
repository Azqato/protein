// View rendering and event wiring for the Today, Week, and Month views.

let entries = loadEntries();
let goals = loadGoals();

const views = {
  today: document.getElementById("view-today"),
  week: document.getElementById("view-week"),
  month: document.getElementById("view-month"),
};

document.getElementById("todayDate").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const tabs = document.querySelectorAll(".tab[data-view]");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const view = tab.dataset.view;
    Object.entries(views).forEach(([key, el]) => {
      el.hidden = key !== view;
    });
    if (view === "week") renderWeek();
    if (view === "month") renderMonth();
  });
});

function entriesForDate(dateStr) {
  return entries.filter((entry) => entry.date === dateStr);
}

function totalsFor(dateStr) {
  return entriesForDate(dateStr).reduce(
    (acc, entry) => {
      acc.calories += Number(entry.calories) || 0;
      acc.protein += Number(entry.protein) || 0;
      return acc;
    },
    { calories: 0, protein: 0 }
  );
}

function formatRatio(calories, protein) {
  if (!protein || protein <= 0) return "N/A";
  return `${(calories / protein).toFixed(1)}:1`;
}

function renderGoalSummary() {
  const goal = resolveGoalForDate(todayStr(), goals);
  const calorieGoal = goal ? Number(goal.calorieGoal) || 0 : 0;
  const proteinGoal = goal ? Number(goal.proteinGoal) || 0 : 0;

  document.getElementById("goalCalories").textContent = `${calorieGoal} kcal`;
  document.getElementById("goalProtein").textContent = `${proteinGoal}g protein`;

  const calorieInput = document.getElementById("goalCalorieInput");
  const proteinInput = document.getElementById("goalProteinInput");
  if (document.activeElement !== calorieInput) calorieInput.value = calorieGoal || "";
  if (document.activeElement !== proteinInput) proteinInput.value = proteinGoal || "";

  return { calorieGoal, proteinGoal };
}

function renderToday() {
  const { calorieGoal, proteinGoal } = renderGoalSummary();
  const totals = totalsFor(todayStr());
  const caloriePct = calorieGoal ? Math.min(100, Math.round((totals.calories / calorieGoal) * 100)) : 0;
  const proteinPct = proteinGoal ? Math.min(100, Math.round((totals.protein / proteinGoal) * 100)) : 0;

  document.getElementById("calorieRing").style.setProperty("--pct", `${caloriePct}%`);
  document.getElementById("calorieRingValue").textContent = `${caloriePct}%`;
  document.getElementById("calorieCaption").textContent = `${totals.calories} kcal / ${calorieGoal} kcal`;

  document.getElementById("proteinRing").style.setProperty("--pct", `${proteinPct}%`);
  document.getElementById("proteinRingValue").textContent = `${proteinPct}%`;
  document.getElementById("proteinCaption").textContent = `${totals.protein}g / ${proteinGoal}g`;

  document.getElementById("kcalToday").textContent = totals.calories;
  document.getElementById("proteinToday").textContent = `${totals.protein}g`;

  document.getElementById("caloriesRow").textContent = `${totals.calories} kcal / ${calorieGoal} kcal`;
  document.getElementById("proteinRow").textContent = `${totals.protein}g / ${proteinGoal}g`;
  document.getElementById("ratioRow").textContent = formatRatio(totals.calories, totals.protein);

  document.getElementById("remainingCalories").textContent = `${Math.max(0, calorieGoal - totals.calories)} kcal`;
  document.getElementById("remainingProtein").textContent = `${Math.max(0, proteinGoal - totals.protein)}g`;

  renderEntryList();
}

function renderEntryList() {
  const container = document.getElementById("entryList");
  const todayEntries = entriesForDate(todayStr()).sort((a, b) => b.timestamp - a.timestamp);

  container.innerHTML = "";

  if (todayEntries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No entries logged yet.";
    container.appendChild(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Date</th><th>Item</th><th>Macros</th><th></th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  todayEntries.forEach((entry) => {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = entry.date;
    tr.appendChild(dateTd);

    const labelTd = document.createElement("td");
    labelTd.textContent = entry.label || "Entry";
    tr.appendChild(labelTd);

    const macroTd = document.createElement("td");
    macroTd.textContent = `${entry.calories} kcal / ${entry.protein}g`;
    tr.appendChild(macroTd);

    const actionTd = document.createElement("td");
    actionTd.style.textAlign = "right";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      entries = entries.filter((e) => e.id !== entry.id);
      saveEntries(entries);
      renderToday();
    });
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

document.getElementById("logEntryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const calories = Number(document.getElementById("inputCalories").value) || 0;
  const protein = Number(document.getElementById("inputProtein").value) || 0;
  const label = document.getElementById("inputLabel").value.trim();

  if (calories <= 0 && protein <= 0) return;

  entries.push({
    id: generateId(),
    date: todayStr(),
    timestamp: Date.now(),
    label: label || null,
    calories,
    protein,
  });
  saveEntries(entries);
  event.target.reset();
  renderToday();
});

document.getElementById("goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const calorieGoal = Number(document.getElementById("goalCalorieInput").value) || 0;
  const proteinGoal = Number(document.getElementById("goalProteinInput").value) || 0;
  goals = upsertGoal(todayStr(), calorieGoal, proteinGoal, goals);
  saveGoals(goals);
  renderToday();
});

function lastNDates(n) {
  const dates = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(dateToStr(d));
  }
  return dates;
}

function renderDayRows(tbody, dateStrs) {
  tbody.innerHTML = "";
  dateStrs.forEach((dateStr) => {
    const totals = totalsFor(dateStr);
    const goal = resolveGoalForDate(dateStr, goals);
    const calorieGoal = goal ? Number(goal.calorieGoal) || 0 : 0;
    const proteinGoal = goal ? Number(goal.proteinGoal) || 0 : 0;

    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = dateStr;
    tr.appendChild(dateTd);

    const calorieTd = document.createElement("td");
    calorieTd.textContent = goal ? `${totals.calories} kcal / ${calorieGoal} kcal` : `${totals.calories} kcal`;
    tr.appendChild(calorieTd);

    const proteinTd = document.createElement("td");
    proteinTd.textContent = goal ? `${totals.protein}g / ${proteinGoal}g` : `${totals.protein}g`;
    tr.appendChild(proteinTd);

    const ratioTd = document.createElement("td");
    ratioTd.textContent = formatRatio(totals.calories, totals.protein);
    tr.appendChild(ratioTd);

    tbody.appendChild(tr);
  });
}

function renderWeek() {
  renderDayRows(document.getElementById("weekTableBody"), lastNDates(7));
}

function renderMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysSoFar = now.getDate();
  const dateStrs = [];
  for (let day = 1; day <= daysSoFar; day++) {
    dateStrs.push(dateToStr(new Date(year, month, day)));
  }
  renderDayRows(document.getElementById("monthTableBody"), dateStrs);
}

document.getElementById("importFile").addEventListener("change", () => {
  const file = document.getElementById("importFile").files[0];
  document.getElementById("importFileName").textContent = file
    ? `Selected: ${file.name}`
    : "No file chosen. Importing replaces all current data.";
});

document.getElementById("exportBtn").addEventListener("click", () => {
  exportToWorkbook(entries, goals);
});

document.getElementById("importBtn").addEventListener("click", async () => {
  const file = document.getElementById("importFile").files[0];
  if (!file) return;
  if (!window.confirm("Importing will replace all current entries and goals. Continue?")) return;

  try {
    const result = await importFromWorkbook(file);
    entries = result.entries.map((entry) => ({
      ...entry,
      calories: Number(entry.calories) || 0,
      protein: Number(entry.protein) || 0,
    }));
    goals = result.goals.map((goal) => ({
      ...goal,
      calorieGoal: Number(goal.calorieGoal) || 0,
      proteinGoal: Number(goal.proteinGoal) || 0,
    }));
    saveEntries(entries);
    saveGoals(goals);
    renderToday();
    window.alert("Import successful.");
  } catch (err) {
    window.alert(`Import failed: ${err.message}`);
  }
});

renderToday();
