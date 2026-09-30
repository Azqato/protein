// Canvas bar-chart renderer shared by the Week, Month, and Year history ranges.
// Reads colors from CSS custom properties so the chart always matches the palette.
// Values arrive pre-scaled by app.js: 1 means "exactly at goal" when `goalLine` is
// true, otherwise each series is scaled to its own max. The day/month list under
// the chart remains the authoritative, screen-reader-friendly source of the data.

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function roundedTopRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

// series: [{ label, values: number[], color, colorEnd }]
// ratio: (number|null)[], rendered as a line overlay on its own scale
function drawBarChart(canvas, { labels, series, ratio, goalLine, activeIndex, tickEvery }) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) return;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const pad = { top: 14, right: 6, bottom: 24, left: 6 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const baseY = pad.top + plotH;

  const maxValue = Math.max(goalLine ? 1.15 : 1, ...series.flatMap((s) => s.values)) * 1.04;
  const yFor = (v) => baseY - (v / maxValue) * plotH;

  const count = labels.length;
  const groupW = plotW / count;
  const innerGap = count > 14 ? 1 : 3;
  const barW = Math.max(1.5, Math.min(14, (groupW * (count > 14 ? 0.8 : 0.62) - innerGap) / series.length));
  const groupBarsW = barW * series.length + innerGap * (series.length - 1);

  // Active column highlight
  if (activeIndex !== null && activeIndex !== undefined) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    const x = pad.left + activeIndex * groupW + 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, pad.top - 6, groupW - 2, plotH + 6, 6);
    else ctx.rect(x, pad.top - 6, groupW - 2, plotH + 6);
    ctx.fill();
  }

  // Baseline
  ctx.strokeStyle = cssVar("--separator");
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, baseY + 0.5);
  ctx.lineTo(pad.left + plotW, baseY + 0.5);
  ctx.stroke();

  // Goal line at 100%
  if (goalLine) {
    const gy = Math.round(yFor(1)) + 0.5;
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(pad.left + plotW, gy);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = cssVar("--text-2");
    ctx.font = "600 10px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("GOAL", pad.left + plotW, gy - 4);
  }

  // Bars
  const stubColor = cssVar("--surface-3");
  series.forEach((s, si) => {
    s.values.forEach((value, i) => {
      const x = pad.left + i * groupW + (groupW - groupBarsW) / 2 + si * (barW + innerGap);
      if (!value) {
        ctx.fillStyle = stubColor;
        roundedTopRect(ctx, x, baseY - 2, barW, 2, 1);
        return;
      }
      const y = yFor(value);
      const h = Math.max(2, baseY - y);
      const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
      grad.addColorStop(0, s.colorEnd || s.color);
      grad.addColorStop(1, s.color);
      ctx.fillStyle = grad;
      ctx.globalAlpha = activeIndex === null || activeIndex === undefined || activeIndex === i ? 1 : 0.45;
      roundedTopRect(ctx, x, baseY - h, barW, h, count > 14 ? 2 : 4);
      ctx.globalAlpha = 1;
    });
  });

  // Ratio line
  const finite = (ratio || []).filter((v) => v !== null && isFinite(v));
  if (finite.length) {
    const maxRatio = Math.max(...finite) * 1.15;
    const ry = (v) => baseY - (v / maxRatio) * plotH;
    const text = cssVar("--text");
    ctx.strokeStyle = text;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    ratio.forEach((v, i) => {
      if (v === null || !isFinite(v)) {
        started = false;
        return;
      }
      const x = pad.left + i * groupW + groupW / 2;
      if (!started) ctx.moveTo(x, ry(v));
      else ctx.lineTo(x, ry(v));
      started = true;
    });
    ctx.stroke();
    if (count <= 14) {
      ctx.fillStyle = text;
      ratio.forEach((v, i) => {
        if (v === null || !isFinite(v)) return;
        ctx.beginPath();
        ctx.arc(pad.left + i * groupW + groupW / 2, ry(v), 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
  }

  // X labels
  ctx.font = "600 11px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  labels.forEach((label, i) => {
    const every = tickEvery || 1;
    const isLast = i === count - 1;
    if (i % every !== 0 && !isLast) return;
    if (!isLast && every > 1 && count - 1 - i < every / 2) return;
    ctx.fillStyle = i === activeIndex ? cssVar("--text") : cssVar("--text-3");
    ctx.fillText(label, pad.left + i * groupW + groupW / 2, height - 6);
  });
}

// Renders a chart into `container`, replacing its contents. Each bar group gets a
// focusable hotspot button so values are reachable by keyboard, mouse, and touch.
// tooltipFor(i) returns { title, rows: [[label, value, color]] }.
function mountChart(container, opts) {
  const { title, labels, tooltipFor } = opts;
  if (container._chartObserver) container._chartObserver.disconnect();

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
  summary.textContent = `${title}. ${labels.map((_, i) => tooltipText(tooltipFor(i))).join(". ")}.`;
  container.appendChild(summary);

  let activeIndex = null;
  const render = () => drawBarChart(canvas, { ...opts, activeIndex });

  function show(i) {
    activeIndex = i;
    const data = tooltipFor(i);
    tooltip.innerHTML = "";
    const t = document.createElement("p");
    t.className = "tt-title";
    t.textContent = data.title;
    tooltip.appendChild(t);
    data.rows.forEach(([label, value, color]) => {
      const row = document.createElement("p");
      row.className = "tt-row";
      const sw = document.createElement("span");
      sw.className = "tt-swatch";
      sw.style.background = color;
      const l = document.createElement("span");
      l.textContent = label;
      const v = document.createElement("b");
      v.textContent = value;
      row.append(sw, l, v);
      tooltip.appendChild(row);
    });
    tooltip.hidden = false;
    // Keep the tooltip inside the card horizontally.
    const w = container.clientWidth;
    const center = ((i + 0.5) / labels.length) * w;
    const half = tooltip.offsetWidth / 2;
    tooltip.style.left = `${Math.min(w - half, Math.max(half, center))}px`;
    render();
  }

  function hide() {
    activeIndex = null;
    tooltip.hidden = true;
    render();
  }

  labels.forEach((_, i) => {
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "chart-hotspot";
    hotspot.setAttribute("aria-label", tooltipText(tooltipFor(i)));
    hotspot.addEventListener("mouseenter", () => show(i));
    hotspot.addEventListener("focus", () => show(i));
    hotspot.addEventListener("mouseleave", hide);
    hotspot.addEventListener("blur", hide);
    // Touch: tap toggles, since touch devices have no hover.
    hotspot.addEventListener("click", () => (activeIndex === i && !tooltip.hidden ? hide() : show(i)));
    hotspots.appendChild(hotspot);
  });

  render();

  // Re-render whenever the container changes size, including when a hidden
  // screen becomes visible and the canvas finally has a real width.
  if ("ResizeObserver" in window) {
    let lastWidth = container.clientWidth;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth !== lastWidth) {
        lastWidth = container.clientWidth;
        render();
      }
    });
    observer.observe(container);
    container._chartObserver = observer;
  } else {
    window.addEventListener("resize", render);
  }
}

function tooltipText(data) {
  return `${data.title}: ${data.rows.map(([label, value]) => `${label} ${value}`).join(", ")}`;
}
