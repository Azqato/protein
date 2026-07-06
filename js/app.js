// View rendering and event wiring for the Today, Week, Month, and Year views.

let entries = loadEntries();
let goals = loadGoals();
let monthOffset = 0; // 0 = current calendar month, -1 = previous month, etc.
let yearOffset = 0; // 0 = current calendar year, -1 = previous year, etc.

const views = {
  today: document.getElementById("view-today"),
  week: document.getElementById("view-week"),
  month: document.getElementById("view-month"),
  year: document.getElementById("view-year"),
};

document.getElementById("todayDate").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const tabs = document.querySelectorAll(".tab[data-view]");

function switchToView(viewKey) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.view === viewKey));
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== viewKey;
  });
  if (viewKey === "today") renderToday();
  if (viewKey === "week") renderWeek();
  if (viewKey === "month") renderMonth();
  if (viewKey === "year") renderYear();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchToView(tab.dataset.view));
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

function ratioValue(calories, protein) {
  if (!protein || protein <= 0) return null;
  return calories / protein;
}

function renderGoalSummary() {
  const goal = resolveGoalForDate(todayStr(), goals);
  const calorieGoal = goal ? Number(goal.calorieGoal) || 0 : 0;
  const proteinGoal = goal ? Number(goal.proteinGoal) || 0 : 0;

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

function weekdayLabel(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short" });
}

function dayOfMonthLabel(dateStr) {
  return String(Number(dateStr.split("-")[2]));
}

// Builds the expandable itemized-entry row shown under a Week/Month date row.
// `onDeleted` is the parent view's own render function (renderWeek/renderMonth),
// called after any delete so the whole view rebuilds consistently, the same
// pattern renderToday() already uses after any mutation.
function renderEntrySubrow(afterRow, dateStr, onDeleted) {
  const subrow = document.createElement("tr");
  subrow.className = "entry-subrow";

  const td = document.createElement("td");
  td.colSpan = 4;

  const dayEntries = entriesForDate(dateStr).sort((a, b) => b.timestamp - a.timestamp);

  if (dayEntries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No entries logged yet.";
    td.appendChild(empty);
  } else {
    dayEntries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "entry-subrow-item";

      const label = document.createElement("span");
      label.className = "entry-label";
      label.textContent = entry.label || "Entry";
      item.appendChild(label);

      const macros = document.createElement("span");
      macros.className = "entry-macros";
      macros.textContent = `${entry.calories} kcal / ${entry.protein}g`;
      item.appendChild(macros);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        entries = entries.filter((e) => e.id !== entry.id);
        saveEntries(entries);
        onDeleted();
      });
      item.appendChild(deleteBtn);

      td.appendChild(item);
    });
  }

  subrow.appendChild(td);
  afterRow.insertAdjacentElement("afterend", subrow);
  return subrow;
}

function renderDayRows(tbody, dateStrs, refreshFn) {
  tbody.innerHTML = "";
  dateStrs.forEach((dateStr) => {
    const totals = totalsFor(dateStr);
    const goal = resolveGoalForDate(dateStr, goals);
    const calorieGoal = goal ? Number(goal.calorieGoal) || 0 : 0;
    const proteinGoal = goal ? Number(goal.proteinGoal) || 0 : 0;

    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "row-toggle";
    toggleBtn.textContent = dateStr;
    toggleBtn.setAttribute("aria-expanded", "false");
    let subrow = null;
    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      if (expanded) {
        subrow.remove();
        subrow = null;
        toggleBtn.setAttribute("aria-expanded", "false");
      } else {
        subrow = renderEntrySubrow(tr, dateStr, refreshFn);
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    });
    dateTd.appendChild(toggleBtn);
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

function renderDayChart(containerId, title, dateStrs, labelFn) {
  const container = document.getElementById(containerId);
  const calorieValues = dateStrs.map((d) => totalsFor(d).calories);
  const proteinValues = dateStrs.map((d) => totalsFor(d).protein);
  const ratios = dateStrs.map((d) => {
    const t = totalsFor(d);
    return ratioValue(t.calories, t.protein);
  });

  mountChart(container, {
    title,
    labels: dateStrs.map(labelFn),
    series: [
      { label: "Calories", values: calorieValues, color: cssVar("--accent") },
      { label: "Protein", values: proteinValues, color: cssVar("--accent-secondary") },
    ],
    ratio: ratios,
    tooltipFor: (i) => {
      const t = totalsFor(dateStrs[i]);
      return `${dateStrs[i]}: ${t.calories} kcal, ${t.protein}g protein, ${formatRatio(t.calories, t.protein)} ratio`;
    },
  });
}

function renderWeek() {
  const dateStrs = lastNDates(7);
  renderDayRows(document.getElementById("weekTableBody"), dateStrs, renderWeek);
  renderDayChart("weekChart", "Calories and protein for the last 7 days", dateStrs, weekdayLabel);
}

function monthBounds(offset) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return { year: target.getFullYear(), month: target.getMonth() };
}

function renderMonth() {
  const { year, month } = monthBounds(monthOffset);
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const daysToShow = isCurrentMonth ? now.getDate() : daysInMonth(year, month);

  const dateStrs = [];
  for (let day = 1; day <= daysToShow; day++) {
    dateStrs.push(dateToStr(new Date(year, month, day)));
  }

  document.getElementById("monthNavLabel").textContent = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  document.getElementById("monthNextBtn").disabled = monthOffset >= 0;

  renderDayRows(document.getElementById("monthTableBody"), dateStrs, renderMonth);
  renderDayChart("monthChart", "Calories and protein for the month", dateStrs, dayOfMonthLabel);
}

document.getElementById("monthPrevBtn").addEventListener("click", () => {
  monthOffset -= 1;
  renderMonth();
});

document.getElementById("monthNextBtn").addEventListener("click", () => {
  if (monthOffset >= 0) return;
  monthOffset += 1;
  renderMonth();
});

function renderYear() {
  const now = new Date();
  const year = now.getFullYear() + yearOffset;
  const isCurrentYear = yearOffset === 0;
  const monthsToShow = isCurrentYear ? now.getMonth() + 1 : 12;

  document.getElementById("yearNavLabel").textContent = String(year);
  document.getElementById("yearNextBtn").disabled = yearOffset >= 0;

  const tbody = document.getElementById("yearTableBody");
  tbody.innerHTML = "";

  const monthLabels = [];
  const calorieValues = [];
  const proteinValues = [];
  const ratios = [];

  for (let month = 0; month < monthsToShow; month++) {
    const totals = totalsForMonth(year, month, totalsFor);
    const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: "short" });
    monthLabels.push(monthName);
    calorieValues.push(totals.calories);
    proteinValues.push(totals.protein);
    ratios.push(ratioValue(totals.calories, totals.protein));

    const tr = document.createElement("tr");
    const monthTd = document.createElement("td");
    const monthBtn = document.createElement("button");
    monthBtn.type = "button";
    monthBtn.className = "row-toggle";
    monthBtn.textContent = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long" });
    monthBtn.addEventListener("click", () => {
      monthOffset = (year - now.getFullYear()) * 12 + (month - now.getMonth());
      switchToView("month");
    });
    monthTd.appendChild(monthBtn);
    tr.appendChild(monthTd);
    const calorieTd = document.createElement("td");
    calorieTd.textContent = `${totals.calories} kcal`;
    tr.appendChild(calorieTd);
    const proteinTd = document.createElement("td");
    proteinTd.textContent = `${totals.protein}g`;
    tr.appendChild(proteinTd);
    const ratioTd = document.createElement("td");
    ratioTd.textContent = formatRatio(totals.calories, totals.protein);
    tr.appendChild(ratioTd);
    tbody.appendChild(tr);
  }

  mountChart(document.getElementById("yearChart"), {
    title: `Calories and protein by month for ${year}`,
    labels: monthLabels,
    series: [
      { label: "Calories", values: calorieValues, color: cssVar("--accent") },
      { label: "Protein", values: proteinValues, color: cssVar("--accent-secondary") },
    ],
    ratio: ratios,
    tooltipFor: (i) =>
      `${monthLabels[i]} ${year}: ${calorieValues[i]} kcal, ${proteinValues[i]}g protein, ${formatRatio(calorieValues[i], proteinValues[i])} ratio`,
  });
}

document.getElementById("yearPrevBtn").addEventListener("click", () => {
  yearOffset -= 1;
  renderYear();
});

document.getElementById("yearNextBtn").addEventListener("click", () => {
  if (yearOffset >= 0) return;
  yearOffset += 1;
  renderYear();
});

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
  const confirmed = await confirmModal(
    "Importing will replace all current entries and goals. Continue?",
    "Replace current data?"
  );
  if (!confirmed) return;

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
    await alertModal("Import successful.", "Success");
  } catch (err) {
    await alertModal(`Import failed: ${err.message}`, "Import failed");
  }
});

renderToday();
