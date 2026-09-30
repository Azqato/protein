// App shell: hash routing, screen rendering, the log sheet, and event wiring for
// the Today, History, Goal, and More screens.

let entries = loadEntries();
let goals = loadGoals();

const state = {
  range: "week", // week | month | year
  monthOffset: 0, // 0 = current calendar month, -1 = previous month, etc.
  yearOffset: 0, // 0 = current calendar year, -1 = previous year, etc.
  expandedDays: new Set(), // dates whose History rows are open, kept across re-renders
};

const $ = (id) => document.getElementById(id);
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const fmt = (n) => numberFormat.format(Math.round((Number(n) || 0) * 10) / 10);

/* ---------- Data helpers ---------- */

function entriesForDate(dateStr) {
  return entries.filter((entry) => entry.date === dateStr);
}

// One pass over every entry, keyed by date, so History ranges (up to a full year)
// don't re-filter the entry list once per day.
function buildDayIndex() {
  const index = new Map();
  entries.forEach((entry) => {
    const day = index.get(entry.date) || { calories: 0, protein: 0, count: 0 };
    day.calories += Number(entry.calories) || 0;
    day.protein += Number(entry.protein) || 0;
    day.count += 1;
    index.set(entry.date, day);
  });
  return index;
}

const EMPTY_DAY = Object.freeze({ calories: 0, protein: 0, count: 0 });

function goalFor(dateStr) {
  const goal = resolveGoalForDate(dateStr, goals);
  if (!goal) return null;
  return { calorieGoal: Number(goal.calorieGoal) || 0, proteinGoal: Number(goal.proteinGoal) || 0 };
}

function ratioValue(calories, protein) {
  if (!protein || protein <= 0) return null;
  return calories / protein;
}

function formatRatio(calories, protein) {
  const r = ratioValue(calories, protein);
  return r === null ? "N/A" : `${r.toFixed(1)}:1`;
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function lastNDates(n) {
  const dates = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    dates.push(dateToStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  return dates;
}

function friendlyDay(dateStr) {
  const today = todayStr();
  const yesterday = dateToStr(new Date(Date.now() - 864e5));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return parseDate(dateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(ts) {
  return ts ? new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#i-${name}`);
  svg.appendChild(use);
  return svg;
}

/* ---------- Routing ---------- */

const SCREENS = ["today", "history", "goal", "more"];
const renderers = { today: renderToday, history: renderHistory, goal: renderGoal, more: renderMore };

function currentScreen() {
  const key = location.hash.replace(/^#\/?/, "");
  return SCREENS.includes(key) ? key : "today";
}

function showScreen(key) {
  SCREENS.forEach((name) => {
    $(`screen-${name}`).hidden = name !== key;
  });
  document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
    if (tab.dataset.tab === key) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  renderers[key]();
}

function renderCurrent() {
  renderers[currentScreen()]();
}

window.addEventListener("hashchange", () => showScreen(currentScreen()));

// Compact title bar fades in once the large title scrolls out of view.
document.querySelectorAll(".screen").forEach((screen) => {
  screen.addEventListener("scroll", () => screen.classList.toggle("scrolled", screen.scrollTop > 36), {
    passive: true,
  });
});

/* ---------- Today ---------- */

function setArc(arc, pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  arc.style.strokeDasharray = `${clamped} 100`;
  arc.classList.toggle("is-empty", clamped <= 0);
}

function renderMetric(prefix, eaten, goal, unit, unitSpaced) {
  const pct = goal ? (eaten / goal) * 100 : 0;
  $(`${prefix}Eaten`).textContent = fmt(eaten);
  $(`${prefix}Of`).textContent = goal ? ` / ${fmt(goal)}${unitSpaced}` : unitSpaced;
  $(`${prefix}Bar`).style.width = `${Math.min(100, pct)}%`;

  const foot = $(`${prefix}Foot`);
  if (!goal) {
    foot.textContent = "No goal set";
    foot.classList.remove("over");
  } else {
    const left = goal - eaten;
    foot.textContent =
      left >= 0 ? `${fmt(left)}${unit} left · ${Math.round(pct)}%` : `${fmt(-left)}${unit} over · ${Math.round(pct)}%`;
    foot.classList.toggle("over", left < 0 && prefix === "cal");
  }
  return pct;
}

function renderToday() {
  const today = todayStr();
  const totals = entriesForDate(today).reduce(
    (acc, e) => ({ calories: acc.calories + (Number(e.calories) || 0), protein: acc.protein + (Number(e.protein) || 0) }),
    { calories: 0, protein: 0 }
  );
  const goal = goalFor(today);
  const calorieGoal = goal ? goal.calorieGoal : 0;
  const proteinGoal = goal ? goal.proteinGoal : 0;

  $("todayDate").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  $("goalCallout").hidden = Boolean(goal);

  const calPct = renderMetric("cal", totals.calories, calorieGoal, " kcal", " kcal");
  const proPct = renderMetric("pro", totals.protein, proteinGoal, "g", " g");
  setArc($("calArc"), calPct);
  setArc($("proArc"), proPct);

  const ringNum = $("ringNum");
  const ringCap = $("ringCap");
  ringCap.classList.remove("over");
  if (calorieGoal) {
    const left = calorieGoal - totals.calories;
    ringNum.textContent = fmt(Math.abs(left));
    ringCap.textContent = left >= 0 ? "kcal left" : "kcal over";
    ringCap.classList.toggle("over", left < 0);
  } else {
    ringNum.textContent = fmt(totals.calories);
    ringCap.textContent = "kcal eaten";
  }
  $("ringWrap").setAttribute(
    "aria-label",
    goal
      ? `Calories ${Math.round(calPct)}% of goal, ${ringNum.textContent} ${ringCap.textContent}. Protein ${Math.round(proPct)}% of goal.`
      : `${fmt(totals.calories)} kcal and ${fmt(totals.protein)} grams of protein eaten today. No goal set.`
  );

  $("ratioToday").textContent = formatRatio(totals.calories, totals.protein);

  renderTodayEntries();
}

let justAddedId = null;

function renderTodayEntries() {
  const list = $("todayEntries");
  const todays = entriesForDate(todayStr()).sort((a, b) => b.timestamp - a.timestamp);
  list.innerHTML = "";
  $("todayEmpty").hidden = todays.length > 0;
  $("entryMeta").textContent = todays.length ? `${todays.length} ${todays.length === 1 ? "entry" : "entries"}` : "";
  todays.forEach((entry) => list.appendChild(entryRow(entry, true)));
  justAddedId = null;
}

function entryRow(entry, showTime) {
  const li = el("li", "entry");
  if (entry.id === justAddedId) li.classList.add("entering");

  const main = el("div", "entry-main");
  const title = el("p", "entry-title", entry.label || "Entry");
  if (!entry.label) title.classList.add("unlabeled");
  main.appendChild(title);
  if (showTime && entry.timestamp) main.appendChild(el("p", "entry-sub", timeLabel(entry.timestamp)));
  li.appendChild(main);

  li.appendChild(macros(entry.calories, entry.protein));

  const del = el("button", "icon-btn delete");
  del.type = "button";
  del.setAttribute("aria-label", `Delete ${entry.label || "entry"}, ${fmt(entry.calories)} kcal, ${fmt(entry.protein)} grams protein`);
  del.appendChild(icon("trash"));
  del.addEventListener("click", () => deleteEntry(entry.id));
  li.appendChild(del);
  return li;
}

function macros(calories, protein) {
  const wrap = el("div", "macros num");
  const k = el("span", "k", fmt(calories));
  k.appendChild(el("small", "", " kcal"));
  const p = el("span", "p", fmt(protein));
  p.appendChild(el("small", "", " g"));
  wrap.append(k, p);
  return wrap;
}

function deleteEntry(id) {
  const index = entries.findIndex((e) => e.id === id);
  if (index < 0) return;
  const [removed] = entries.splice(index, 1);
  saveEntries(entries);
  renderCurrent();
  showToast(`Deleted ${removed.label || "entry"}`, "Undo", () => {
    entries.push(removed);
    saveEntries(entries);
    renderCurrent();
  });
}

/* ---------- History ---------- */

function monthBounds(offset) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return { year: target.getFullYear(), month: target.getMonth() };
}

function datesThrough(year, month) {
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth();
  const last = isCurrent ? now.getDate() : daysInMonth(year, month);
  const dates = [];
  for (let day = 1; day <= last; day++) dates.push(dateToStr(new Date(year, month, day)));
  return dates;
}

document.querySelectorAll(".seg[data-range]").forEach((seg) => {
  seg.addEventListener("click", () => {
    state.range = seg.dataset.range;
    if (state.range === "month") state.monthOffset = 0;
    if (state.range === "year") state.yearOffset = 0;
    renderHistory();
  });
});

$("periodPrev").addEventListener("click", () => {
  if (state.range === "month") state.monthOffset -= 1;
  if (state.range === "year") state.yearOffset -= 1;
  renderHistory();
});

$("periodNext").addEventListener("click", () => {
  if (state.range === "month" && state.monthOffset < 0) state.monthOffset += 1;
  if (state.range === "year" && state.yearOffset < 0) state.yearOffset += 1;
  renderHistory();
});

// Aggregates a list of periods (days, or months as lists of days) into totals,
// goal sums, and counts, all from one shared day index.
function summarize(dates, index) {
  const sum = { calories: 0, protein: 0, calorieGoal: 0, proteinGoal: 0, logged: 0, proteinHits: 0, hasGoal: true };
  dates.forEach((d) => {
    const day = index.get(d) || EMPTY_DAY;
    const goal = goalFor(d);
    sum.calories += day.calories;
    sum.protein += day.protein;
    if (day.count) sum.logged += 1;
    if (goal) {
      sum.calorieGoal += goal.calorieGoal;
      sum.proteinGoal += goal.proteinGoal;
      if (day.count && goal.proteinGoal && day.protein >= goal.proteinGoal) sum.proteinHits += 1;
    } else {
      sum.hasGoal = false;
    }
  });
  return sum;
}

function renderHistory() {
  const index = buildDayIndex();
  const range = state.range;

  const segs = document.querySelectorAll(".seg[data-range]");
  segs.forEach((seg, i) => {
    const selected = seg.dataset.range === range;
    seg.setAttribute("aria-selected", String(selected));
    if (selected) document.querySelector(".segmented").style.setProperty("--seg-index", i);
  });

  const prev = $("periodPrev");
  const next = $("periodNext");
  prev.classList.toggle("is-hidden", range === "week");
  next.classList.toggle("is-hidden", range === "week");

  let periods; // [{ key, label, dates }]
  let allDates;
  if (range === "week") {
    allDates = lastNDates(7);
    periods = allDates.map((d) => ({ key: d, dates: [d], label: parseDate(d).toLocaleDateString(undefined, { weekday: "narrow" }) }));
    $("periodLabel").textContent = "Last 7 days";
    next.disabled = true;
  } else if (range === "month") {
    const { year, month } = monthBounds(state.monthOffset);
    allDates = datesThrough(year, month);
    periods = allDates.map((d) => ({ key: d, dates: [d], label: String(parseDate(d).getDate()) }));
    $("periodLabel").textContent = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    next.disabled = state.monthOffset >= 0;
    prev.setAttribute("aria-label", "Previous month");
    next.setAttribute("aria-label", "Next month");
  } else {
    const now = new Date();
    const year = now.getFullYear() + state.yearOffset;
    const months = state.yearOffset === 0 ? now.getMonth() + 1 : 12;
    periods = [];
    for (let m = 0; m < months; m++) {
      periods.push({
        key: `${year}-${m}`,
        month: m,
        year,
        dates: datesThrough(year, m),
        label: new Date(year, m, 1).toLocaleDateString(undefined, { month: "narrow" }),
      });
    }
    allDates = periods.flatMap((p) => p.dates);
    $("periodLabel").textContent = String(year);
    next.disabled = state.yearOffset >= 0;
    prev.setAttribute("aria-label", "Previous year");
    next.setAttribute("aria-label", "Next year");
  }

  renderTiles(summarize(allDates, index), allDates.length);

  const sums = periods.map((p) => summarize(p.dates, index));
  renderHistoryChart(periods, sums, range);

  if (range === "year") renderMonthList(periods, sums);
  else renderDayList(allDates, index);
}

function tile(label, value, unit, tone) {
  const t = el("div", `tile${tone ? ` ${tone}` : ""}`);
  t.appendChild(el("p", "tile-label", label));
  const v = el("p", "tile-value num", value);
  if (unit) v.appendChild(el("small", "", unit));
  t.appendChild(v);
  return t;
}

function renderTiles(sum, dayCount) {
  const tiles = $("historyTiles");
  tiles.innerHTML = "";
  const avgCal = sum.logged ? sum.calories / sum.logged : 0;
  const avgPro = sum.logged ? sum.protein / sum.logged : 0;
  tiles.append(
    tile("Avg calories", fmt(Math.round(avgCal)), "kcal", "cal"),
    tile("Avg protein", fmt(avgPro), "g", "pro"),
    tile("Days logged", String(sum.logged), `of ${dayCount}`),
    tile("Protein goal hit", String(sum.proteinHits), sum.proteinHits === 1 ? "day" : "days")
  );
}

function renderHistoryChart(periods, sums, range) {
  // Plot as % of goal when every period with data has a goal; otherwise fall back
  // to scaling each series against its own max so the chart is still readable.
  const goalMode = sums.every((s) => s.logged === 0 || (s.hasGoal && s.calorieGoal > 0 && s.proteinGoal > 0));
  const maxCal = Math.max(1, ...sums.map((s) => s.calories));
  const maxPro = Math.max(1, ...sums.map((s) => s.protein));
  const scale = (value, goal, max) => (goalMode ? (goal ? value / goal : 0) : value / max);

  $("chartTitle").textContent = goalMode ? "Progress vs goal" : "Calories and protein";

  const calColor = cssVar("--accent");
  const proColor = cssVar("--protein");
  const periodTitle = (p) =>
    range === "year"
      ? new Date(p.year, p.month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : parseDate(p.key).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  mountChart($("historyChart"), {
    title: goalMode ? "Calories and protein as a percent of goal" : "Calories and protein",
    labels: periods.map((p) => p.label),
    tickEvery: range === "month" ? 5 : 1,
    goalLine: goalMode,
    series: [
      { label: "Calories", values: sums.map((s) => scale(s.calories, s.calorieGoal, maxCal)), color: calColor, colorEnd: cssVar("--accent-hi") },
      { label: "Protein", values: sums.map((s) => scale(s.protein, s.proteinGoal, maxPro)), color: proColor, colorEnd: cssVar("--protein-hi") },
    ],
    ratio: sums.map((s) => ratioValue(s.calories, s.protein)),
    tooltipFor: (i) => {
      const s = sums[i];
      const withGoal = (v, g, u) => (s.hasGoal && g ? `${fmt(v)} / ${fmt(g)}${u}` : `${fmt(v)}${u}`);
      return {
        title: periodTitle(periods[i]),
        rows: [
          ["Calories", withGoal(s.calories, s.calorieGoal, " kcal"), calColor],
          ["Protein", withGoal(s.protein, s.proteinGoal, " g"), proColor],
          ["Ratio", formatRatio(s.calories, s.protein), cssVar("--text")],
        ],
      };
    },
  });
}

function miniBars(calPct, proPct) {
  const wrap = el("div", "day-bars");
  wrap.setAttribute("aria-hidden", "true");
  [["cal", calPct], ["pro", proPct]].forEach(([tone, pct]) => {
    const bar = el("div", `mini ${tone}`);
    const fill = el("span");
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    bar.appendChild(fill);
    wrap.appendChild(bar);
  });
  return wrap;
}

function renderDayList(dates, index) {
  $("historyListTitle").textContent = "Days";
  const list = $("historyList");
  list.innerHTML = "";

  [...dates].reverse().forEach((dateStr) => {
    const day = index.get(dateStr) || EMPTY_DAY;
    const goal = goalFor(dateStr);
    const li = el("li", day.count ? "day" : "day day-empty");

    const btn = el("button", "list-row row-link day-toggle");
    btn.type = "button";

    const main = el("div", "day-main");
    main.appendChild(el("p", "day-title", friendlyDay(dateStr)));
    main.appendChild(
      el(
        "p",
        "day-sub num",
        day.count
          ? `${day.count} ${day.count === 1 ? "entry" : "entries"} · ${formatRatio(day.calories, day.protein)}`
          : "No entries"
      )
    );
    btn.appendChild(main);

    if (day.count && goal) {
      btn.appendChild(
        miniBars(
          goal.calorieGoal ? (day.calories / goal.calorieGoal) * 100 : 0,
          goal.proteinGoal ? (day.protein / goal.proteinGoal) * 100 : 0
        )
      );
    }
    btn.appendChild(macros(day.calories, day.protein));
    const chev = icon("chev-right");
    chev.classList.add("chev");
    btn.appendChild(chev);
    li.appendChild(btn);

    if (!day.count) {
      btn.disabled = true;
      chev.style.visibility = "hidden";
    } else {
      const panelId = `day-${dateStr}`;
      btn.setAttribute("aria-controls", panelId);
      const expanded = state.expandedDays.has(dateStr);
      btn.setAttribute("aria-expanded", String(expanded));
      btn.setAttribute("aria-label", `${friendlyDay(dateStr)}, ${fmt(day.calories)} kcal, ${fmt(day.protein)} grams protein. Show entries`);

      const panel = el("ul", "day-entries");
      panel.id = panelId;
      panel.hidden = !expanded;
      if (expanded) fillDayPanel(panel, dateStr);
      li.appendChild(panel);

      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
        if (open) {
          state.expandedDays.add(dateStr);
          fillDayPanel(panel, dateStr);
        } else {
          state.expandedDays.delete(dateStr);
        }
      });
    }

    list.appendChild(li);
  });
}

function fillDayPanel(panel, dateStr) {
  panel.innerHTML = "";
  entriesForDate(dateStr)
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((entry) => panel.appendChild(entryRow(entry, true)));
}

function renderMonthList(periods, sums) {
  $("historyListTitle").textContent = "Months";
  const list = $("historyList");
  list.innerHTML = "";

  periods
    .map((p, i) => ({ p, s: sums[i] }))
    .reverse()
    .forEach(({ p, s }) => {
      const li = el("li", s.logged ? "day" : "day day-empty");
      const btn = el("button", "list-row row-link day-toggle");
      btn.type = "button";
      const name = new Date(p.year, p.month, 1).toLocaleDateString(undefined, { month: "long" });

      const main = el("div", "day-main");
      main.appendChild(el("p", "day-title", name));
      main.appendChild(
        el(
          "p",
          "day-sub num",
          s.logged ? `${s.logged} days logged · ${formatRatio(s.calories, s.protein)}` : "No entries"
        )
      );
      btn.appendChild(main);
      if (s.logged && s.hasGoal) {
        btn.appendChild(
          miniBars(s.calorieGoal ? (s.calories / s.calorieGoal) * 100 : 0, s.proteinGoal ? (s.protein / s.proteinGoal) * 100 : 0)
        );
      }
      btn.appendChild(macros(s.calories, s.protein));
      const chev = icon("chev-right");
      chev.classList.add("chev");
      btn.appendChild(chev);
      btn.setAttribute("aria-label", `${name}: ${fmt(s.calories)} kcal, ${fmt(s.protein)} grams protein. Open month`);

      // Year rows are month aggregates; entry-level deletion happens in the Month range.
      btn.addEventListener("click", () => {
        const now = new Date();
        state.monthOffset = (p.year - now.getFullYear()) * 12 + (p.month - now.getMonth());
        state.range = "month";
        renderHistory();
        $("screen-history").scrollTo({ top: 0, behavior: "smooth" });
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
}

/* ---------- Goal ---------- */

function renderGoal() {
  const today = todayStr();
  const goal = goalFor(today);
  const current = $("goalCurrent");
  current.innerHTML = "";

  if (goal) {
    const record = resolveGoalForDate(today, goals);
    [["cal", "Calories", goal.calorieGoal, "kcal"], ["pro", "Protein", goal.proteinGoal, "g"]].forEach(
      ([tone, label, value, unit]) => {
        const box = el("div", tone);
        box.appendChild(el("p", "gc-label", label));
        const v = el("p", "gc-value num", fmt(value));
        v.appendChild(el("small", "", unit));
        box.appendChild(v);
        current.appendChild(box);
      }
    );
    const since = parseDate(record.effectiveDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    current.appendChild(el("p", "gc-foot num", `Since ${since} · target ratio ${formatRatio(goal.calorieGoal, goal.proteinGoal)}`));
  } else {
    current.appendChild(el("p", "gc-empty", "No goal yet. Set one below and it applies to every day from today on."));
  }

  const calInput = $("goalCalorieInput");
  const proInput = $("goalProteinInput");
  if (document.activeElement !== calInput) calInput.value = goal && goal.calorieGoal ? goal.calorieGoal : "";
  if (document.activeElement !== proInput) proInput.value = goal && goal.proteinGoal ? goal.proteinGoal : "";
  updateGoalHint();

  const history = [...goals].sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  const list = $("goalHistory");
  list.innerHTML = "";
  $("goalHistoryHead").hidden = history.length === 0;
  const record = resolveGoalForDate(today, goals);
  history.forEach((g) => {
    const li = el("li", "list-row");
    const main = el("div", "day-main");
    const title = el("p", "day-title", parseDate(g.effectiveDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
    if (record && g.effectiveDate === record.effectiveDate) {
      title.append(" ");
      title.appendChild(el("span", "pill current", "Current"));
    }
    main.appendChild(title);
    main.appendChild(el("p", "day-sub num", `Ratio ${formatRatio(Number(g.calorieGoal), Number(g.proteinGoal))}`));
    li.appendChild(main);
    li.appendChild(macros(g.calorieGoal, g.proteinGoal));
    list.appendChild(li);
  });
}

function updateGoalHint() {
  const cal = Number($("goalCalorieInput").value) || 0;
  const pro = Number($("goalProteinInput").value) || 0;
  $("goalRatioHint").textContent =
    cal && pro
      ? `Target ratio ${formatRatio(cal, pro)}. Applies from today forward until you change it.`
      : "Applies from today forward until you change it.";
}

$("goalCalorieInput").addEventListener("input", updateGoalHint);
$("goalProteinInput").addEventListener("input", updateGoalHint);

$("goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const calorieGoal = Math.max(0, Number($("goalCalorieInput").value) || 0);
  const proteinGoal = Math.max(0, Number($("goalProteinInput").value) || 0);
  if (!calorieGoal && !proteinGoal) {
    event.target.classList.remove("shake");
    void event.target.offsetWidth;
    event.target.classList.add("shake");
    $("goalCalorieInput").focus();
    return;
  }
  goals = upsertGoal(todayStr(), calorieGoal, proteinGoal, goals);
  saveGoals(goals);
  document.activeElement.blur();
  renderGoal();
  showToast("Goal saved");
});

/* ---------- More ---------- */

function renderMore() {
  const days = new Set(entries.map((e) => e.date)).size;
  $("storageSummary").textContent =
    `${entries.length} ${entries.length === 1 ? "entry" : "entries"} across ${days} ${days === 1 ? "day" : "days"}, ` +
    `${goals.length} ${goals.length === 1 ? "goal" : "goals"}. Nothing is sent to a server. Export regularly as a backup.`;
}

$("exportBtn").addEventListener("click", async () => {
  try {
    await exportToWorkbook(entries, goals);
    showToast("Export downloaded");
  } catch (err) {
    await alertModal(`Export failed: ${err.message}`, "Export failed");
  }
});

$("importBtn").addEventListener("click", () => $("importFile").click());

$("importFile").addEventListener("change", async (event) => {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;
  const confirmed = await confirmModal(
    `Importing "${file.name}" will replace all ${entries.length} current entries and your goal history.`,
    "Replace current data?"
  );
  if (!confirmed) {
    input.value = "";
    return;
  }
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
    state.expandedDays.clear();
    renderCurrent();
    await alertModal(`Restored ${entries.length} entries and ${goals.length} goals.`, "Import successful");
  } catch (err) {
    await alertModal(`Import failed: ${err.message}`, "Import failed");
  } finally {
    input.value = "";
  }
});

/* ---------- Log sheet ---------- */

const logLayer = $("logLayer");
const logSheet = $("logSheet");
let sheetReturnFocus = null;

function recentFoods() {
  const seen = new Set();
  const recents = [];
  [...entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .some((entry) => {
      const key = entry.label ? entry.label.trim().toLowerCase() : "";
      if (!key || seen.has(key)) return false;
      seen.add(key);
      recents.push(entry);
      return recents.length >= 8;
    });
  return recents;
}

function renderRecents() {
  const wrap = $("recents");
  wrap.innerHTML = "";
  const recents = recentFoods();
  $("recentsWrap").hidden = recents.length === 0;
  recents.forEach((entry) => {
    const chip = el("button", "chip");
    chip.type = "button";
    chip.appendChild(el("b", "", entry.label));
    chip.appendChild(el("span", "num", `${fmt(entry.calories)} kcal · ${fmt(entry.protein)} g`));
    chip.setAttribute("aria-label", `Fill in ${entry.label}: ${fmt(entry.calories)} kcal, ${fmt(entry.protein)} grams protein`);
    chip.addEventListener("click", () => {
      $("inputCalories").value = entry.calories;
      $("inputProtein").value = entry.protein;
      $("inputLabel").value = entry.label;
      $("logError").textContent = "";
      logSheet.querySelector('button[type="submit"]').focus();
    });
    wrap.appendChild(chip);
  });
}

function openLogSheet() {
  if (!logLayer.hidden) return;
  sheetReturnFocus = document.activeElement;
  $("logEntryForm").reset();
  $("logError").textContent = "";
  renderRecents();
  logLayer.hidden = false;
  logSheet.style.setProperty("--drag", "0px");
  requestAnimationFrame(() => {
    logLayer.classList.add("open");
    $("inputCalories").focus({ preventScroll: true });
  });
}

function closeLogSheet() {
  if (logLayer.hidden) return;
  logLayer.classList.remove("open");
  const finish = () => {
    logLayer.hidden = true;
    if (sheetReturnFocus && document.contains(sheetReturnFocus)) sheetReturnFocus.focus({ preventScroll: true });
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) finish();
  else setTimeout(finish, 320);
}

document.querySelectorAll("[data-open-log]").forEach((btn) => btn.addEventListener("click", openLogSheet));
logLayer.querySelectorAll("[data-close-sheet]").forEach((node) => node.addEventListener("click", closeLogSheet));

logLayer.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.stopPropagation();
    closeLogSheet();
    return;
  }
  if (event.key === "Tab") {
    const focusable = [...logSheet.querySelectorAll("button, input")].filter((n) => !n.disabled && n.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Enter in the number fields moves to the next field instead of submitting early.
["inputCalories", "inputProtein"].forEach((id, i, ids) => {
  $(id).addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      (i < ids.length - 1 ? $(ids[i + 1]) : $("inputLabel")).focus();
    }
  });
});

// Drag the grab handle down to dismiss, like a native sheet.
(function enableSheetDrag() {
  const grab = $("sheetGrab");
  let startY = null;
  let delta = 0;
  grab.addEventListener("pointerdown", (event) => {
    startY = event.clientY;
    delta = 0;
    logSheet.classList.add("dragging");
    grab.setPointerCapture(event.pointerId);
  });
  grab.addEventListener("pointermove", (event) => {
    if (startY === null) return;
    delta = Math.max(0, event.clientY - startY);
    logSheet.style.setProperty("--drag", `${delta}px`);
  });
  const end = () => {
    if (startY === null) return;
    startY = null;
    logSheet.classList.remove("dragging");
    if (delta > 90) closeLogSheet();
    logSheet.style.setProperty("--drag", "0px");
  };
  grab.addEventListener("pointerup", end);
  grab.addEventListener("pointercancel", end);
})();

$("logEntryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const calories = Math.max(0, Number($("inputCalories").value) || 0);
  const protein = Math.max(0, Number($("inputProtein").value) || 0);
  const label = $("inputLabel").value.trim();

  if (calories <= 0 && protein <= 0) {
    $("logError").textContent = "Enter calories, protein, or both.";
    const pair = logSheet.querySelector(".field-pair");
    pair.classList.remove("shake");
    void pair.offsetWidth;
    pair.classList.add("shake");
    $("inputCalories").focus();
    return;
  }

  const entry = { id: generateId(), date: todayStr(), timestamp: Date.now(), label: label || null, calories, protein };
  entries.push(entry);
  saveEntries(entries);
  justAddedId = entry.id;
  if (navigator.vibrate) navigator.vibrate(12);
  closeLogSheet();
  renderCurrent();
  showToast(`Added ${fmt(calories)} kcal · ${fmt(protein)} g`, "Undo", () => {
    entries = entries.filter((e) => e.id !== entry.id);
    saveEntries(entries);
    renderCurrent();
  });
});

/* ---------- Toast ---------- */

let toastTimer = null;

function showToast(message, actionLabel, onAction) {
  const toast = $("toast");
  const action = $("toastAction");
  clearTimeout(toastTimer);
  toast.hidden = true;
  void toast.offsetWidth; // restart the entry animation
  $("toastText").textContent = message;
  action.hidden = !actionLabel;
  action.textContent = actionLabel || "";
  action.onclick = () => {
    toast.hidden = true;
    clearTimeout(toastTimer);
    if (onAction) onAction();
  };
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, actionLabel ? 5000 : 2400);
}

/* ---------- Desktop layout toggle ---------- */

// Desktop only: switches between the framed phone view (default) and a
// fullscreen view. Saved per browser as a convenience, not app data.
const layoutToggle = $("layoutToggle");

function applyLayout(full) {
  document.documentElement.classList.toggle("layout-full", full);
  layoutToggle.setAttribute("aria-pressed", String(full));
  layoutToggle.querySelector("use").setAttribute("href", full ? "#i-collapse" : "#i-expand");
  layoutToggle.querySelector("span").textContent = full ? "Exit fullscreen" : "Fullscreen";
}

function toggleLayout() {
  const full = !document.documentElement.classList.contains("layout-full");
  applyLayout(full);
  try {
    localStorage.setItem("proteinpulse_layout", full ? "full" : "framed");
  } catch {
    // storage unavailable; the toggle still works for this visit
  }
}

applyLayout(document.documentElement.classList.contains("layout-full"));
layoutToggle.addEventListener("click", toggleLayout);

/* ---------- Keyboard shortcuts ---------- */

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  if (target.closest && target.closest("input, textarea, select, [contenteditable]")) return;
  if (!logLayer.hidden || !$("modalBackdrop").hidden) return;
  if (event.key === "n" || event.key === "N") {
    event.preventDefault();
    openLogSheet();
  } else if ((event.key === "f" || event.key === "F") && window.matchMedia("(min-width: 640px)").matches) {
    toggleLayout();
  } else if (["1", "2", "3", "4"].includes(event.key)) {
    location.hash = `#/${SCREENS[Number(event.key) - 1]}`;
  }
});

/* ---------- Boot ---------- */

showScreen(currentScreen());

// Roll the Today screen over at midnight if the app is left open.
let bootDay = todayStr();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && todayStr() !== bootDay) {
    bootDay = todayStr();
    renderCurrent();
  }
});
