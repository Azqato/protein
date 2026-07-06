// Canvas bar-chart renderer shared by the Week, Month, and Year views.
// Reads colors from CSS custom properties so the chart always matches the current palette.
// Charts sit above the existing data tables; the tables remain the authoritative,
// screen-reader-friendly source of the same data.

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const mountedCharts = [];

// series: [{ label, values: number[], color }]
// ratio: (number|null)[] (same length as values), rendered as a line overlay
function drawBarChart(canvas, labels, series, ratio) {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  if (cssWidth === 0 || cssHeight === 0) return;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const border = cssVar("--border");
  const textMuted = cssVar("--text-muted");

  const padding = { top: 12, right: 10, bottom: 20, left: 10 };
  const plotWidth = cssWidth - padding.left - padding.right;
  const plotHeight = cssHeight - padding.top - padding.bottom;

  const maxValue = Math.max(1, ...series.flatMap((s) => s.values));

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.stroke();

  const groupCount = labels.length;
  const groupWidth = plotWidth / groupCount;
  const barGap = 2;
  const barWidth = Math.max(1, (groupWidth - barGap * (series.length + 1)) / series.length);

  series.forEach((s, seriesIndex) => {
    ctx.fillStyle = s.color;
    s.values.forEach((value, i) => {
      const barHeight = (value / maxValue) * (plotHeight - 4);
      const x = padding.left + i * groupWidth + barGap + seriesIndex * (barWidth + barGap);
      const y = padding.top + plotHeight - barHeight;
      ctx.fillRect(x, y, barWidth, Math.max(0, barHeight));
    });
  });

  if (ratio && ratio.some((v) => v !== null && isFinite(v))) {
    const finiteRatios = ratio.filter((v) => v !== null && isFinite(v));
    const maxRatio = Math.max(1, ...finiteRatios);
    ctx.strokeStyle = cssVar("--text");
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    ratio.forEach((value, i) => {
      if (value === null || !isFinite(value)) {
        started = false;
        return;
      }
      const x = padding.left + i * groupWidth + groupWidth / 2;
      const y = padding.top + plotHeight - (value / maxRatio) * (plotHeight - 4);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  ctx.fillStyle = textMuted;
  ctx.font = "10px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  const labelIndices = groupCount > 1 ? [0, Math.floor((groupCount - 1) / 2), groupCount - 1] : [0];
  labelIndices.forEach((i) => {
    const x = padding.left + i * groupWidth + groupWidth / 2;
    ctx.fillText(labels[i], x, cssHeight - 6);
  });
}

function chartSummaryText(title, labels, series) {
  const parts = labels.map((label, i) => {
    const values = series.map((s) => `${s.label} ${s.values[i]}`).join(", ");
    return `${label}: ${values}`;
  });
  return `${title}. ${parts.join(". ")}.`;
}

// Renders a chart (with keyboard-reachable per-bar tooltips and a hidden text
// summary for screen readers) into `container`, replacing its current contents.
function mountChart(container, { title, labels, series, ratio, tooltipFor }) {
  container.innerHTML = "";
  container.className = "chart-wrap";

  const canvas = document.createElement("canvas");
  canvas.className = "chart-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const hotspots = document.createElement("div");
  hotspots.className = "chart-hotspots";
  container.appendChild(hotspots);

  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.hidden = true;
  container.appendChild(tooltip);

  const summary = document.createElement("p");
  summary.className = "visually-hidden";
  summary.textContent = chartSummaryText(title, labels, series);
  container.appendChild(summary);

  labels.forEach((label, i) => {
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "chart-hotspot";
    hotspot.setAttribute("aria-label", tooltipFor ? tooltipFor(i) : label);
    const show = () => {
      tooltip.textContent = tooltipFor ? tooltipFor(i) : label;
      tooltip.hidden = false;
      const leftPct = ((i + 0.5) / labels.length) * 100;
      tooltip.style.left = `${leftPct}%`;
    };
    const hide = () => {
      tooltip.hidden = true;
    };
    hotspot.addEventListener("mouseenter", show);
    hotspot.addEventListener("focus", show);
    hotspot.addEventListener("mouseleave", hide);
    hotspot.addEventListener("blur", hide);
    hotspots.appendChild(hotspot);
  });

  const render = () => drawBarChart(canvas, labels, series, ratio);
  render();

  const existingIndex = mountedCharts.findIndex((c) => c.container === container);
  const entry = { container, render };
  if (existingIndex >= 0) {
    mountedCharts[existingIndex] = entry;
  } else {
    mountedCharts.push(entry);
  }
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    mountedCharts.forEach((c) => {
      if (document.body.contains(c.container)) c.render();
    });
  }, 100);
});
