const PLACE_MAP = {
  0: "Todos",
  1: "Alcobendas Principal",
  2: "Las Rozas Principal",
  4: "Legazpi Principal",
  5: "Chamberí Principal"

};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EVOLUTION_RANGES = [30, 90, 180, 365];

let selectedMonths = new Set([...Array(12).keys()]);
let stats, i18n;

async function load() {
  stats = await (await fetch("../data/stats.json")).json();
  i18n = await (await fetch("i18n.json")).json();

  initSelectors();
  initMonthSelector();
  render();
}

function initSelectors() {
  const langSel = document.getElementById("lang");
  Object.keys(i18n).forEach(l => {
    const option = document.createElement("option");
    option.value = l;
    option.textContent = l.toUpperCase();
    langSel.appendChild(option);
  });
  langSel.onchange = render;

  const placeSel = document.getElementById("place");
  Object.entries(PLACE_MAP).forEach(([id, name]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    placeSel.appendChild(option);
  });
  placeSel.value = 4;
  placeSel.onchange = render;

  const evoRangeSel = document.getElementById("evolution-range");
  EVOLUTION_RANGES.forEach(days => {
    const option = document.createElement("option");
    option.value = days;
    evoRangeSel.appendChild(option);
  });
  evoRangeSel.value = EVOLUTION_RANGES[0];
  evoRangeSel.onchange = render;
}

function initMonthSelector() {
  const box = document.getElementById("months");

  MONTH_NAMES.forEach((m, i) => {
    const label = document.createElement("label");
    label.className = "selected";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;

    const span = document.createElement("span");
    span.textContent = m;

    cb.onchange = () => {
      if (cb.checked) {
        selectedMonths.add(i);
        label.classList.add("selected");
      } else {
        selectedMonths.delete(i);
        label.classList.remove("selected");
      }
      render();
    };

    label.appendChild(cb);
    label.appendChild(span);
    box.appendChild(label);
  });
}

function relative(r) {
  return r.Ocupacion / r.Aforo;
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length || 0;
}

function getColorForPercentage(percentage) {
  const p = percentage / 100;

  let r, g, b;

  if (p < 0.5) {
    const ratio = p * 2;
    r = Math.round(100 + (120 - 100) * ratio);
    g = Math.round(180 + (190 - 180) * ratio);
    b = Math.round(140 + (150 - 140) * ratio);
  } else if (p < 0.75) {
    const ratio = (p - 0.5) * 4;
    r = Math.round(120 + (245 - 120) * ratio);
    g = Math.round(190 + (158 - 190) * ratio);
    b = Math.round(150 + (11 - 150) * ratio);
  } else {
    const ratio = (p - 0.75) * 4;
    r = Math.round(245 + (239 - 245) * ratio);
    g = Math.round(158 - (158 - 68) * ratio);
    b = Math.round(11 + (68 - 11) * ratio);
  }

  return { r, g, b };
}

function createBarChart(container, labels, values) {
  container.innerHTML = '';

  values.forEach((value, i) => {
    const barContainer = document.createElement("div");
    barContainer.className = "bar-container";

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = labels[i];

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = "bar-fill";

    const percentage = (value * 100);
    const { r, g, b } = getColorForPercentage(percentage);

    const color1 = `rgb(${r}, ${g}, ${b})`;
    const color2 = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;

    fill.style.background = `linear-gradient(90deg, ${color1}, ${color2})`;
    fill.style.boxShadow = `0 0 15px rgba(${r}, ${g}, ${b}, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)`;
    fill.style.width = `${percentage}%`;

    const valueLabel = document.createElement("span");
    valueLabel.className = "bar-value";
    valueLabel.textContent = `${percentage.toFixed(0)}%`;

    fill.appendChild(valueLabel);
    track.appendChild(fill);
    barContainer.appendChild(label);
    barContainer.appendChild(track);
    container.appendChild(barContainer);
  });
}

function render() {
  const lang = document.getElementById("lang").value;
  const placeId = +document.getElementById("place").value;
  const t = i18n[lang];

  updateLabels(t);

  const rows = stats.flatMap(e =>
    e.data
      .filter(r => (r.IdRecinto === placeId || placeId === 0))
      .map(r => ({
        date: new Date(e.timestamp),
        rel: relative(r)
      }))
  );

  renderTotalAverage(rows);
  renderWeekdayChart(rows);
  renderMonthChart(rows);
  renderEvolutionChart(rows);
}

function updateLabels(t) {
  document.getElementById("title").textContent = "🧗 " + t.title;
  document.getElementById("subtitle").textContent = t.subtitle;
  document.getElementById("label-lang").textContent = t.language;
  document.getElementById("label-place").textContent = t.place;
  document.getElementById("label-total").textContent = t.total;
  document.getElementById("label-weekday").textContent = t.weekday;
  document.getElementById("label-month").textContent = t.month;
  document.getElementById("label-months").textContent = t.months;
  document.getElementById("label-weekday").setAttribute("dataTooltip", t.tooltipWeekday);

  document.getElementById("label-evolution").textContent = t.evolution;

  const ranges = {};
  EVOLUTION_RANGES.forEach(d => {
    ranges[d] = t[`last_${d}_days`];
  });

  const evoSel = document.getElementById("evolution-range");
  Array.from(evoSel.options).forEach(opt => {
    opt.textContent = ranges[opt.value];
  });
}

function renderTotalAverage(rows) {
  const total = average(rows.map(r => r.rel));
  const percentage = total * 100;
  const { r, g, b } = getColorForPercentage(percentage);

  const rVibrant = Math.min(255, Math.round(r * 1.15));
  const gVibrant = Math.min(255, Math.round(g * 1.15));
  const bVibrant = Math.min(255, Math.round(b * 1.15));

  const totalElement = document.getElementById("total");
  totalElement.textContent = `${percentage.toFixed(1)}%`;
  totalElement.style.color = `rgb(${rVibrant}, ${gVibrant}, ${bVibrant})`;
  totalElement.style.textShadow = `0 0 30px rgba(${rVibrant}, ${gVibrant}, ${bVibrant}, 0.8), 0 0 60px rgba(${rVibrant}, ${gVibrant}, ${bVibrant}, 0.5), 0 0 90px rgba(${rVibrant}, ${gVibrant}, ${bVibrant}, 0.3)`;
}

function renderWeekdayChart(rows) {
  const weekday = Array.from({ length: 7 }, (_, d) => {
    const actualDay = (d + 1) % 7;
    return average(rows.filter(r =>
      r.date.getDay() === actualDay && selectedMonths.has(r.date.getMonth())
    ).map(r => r.rel));
  });

  createBarChart(
    document.getElementById("weekday-chart"),
    WEEKDAY_NAMES,
    weekday
  );
}

function renderMonthChart(rows) {
  const month = Array.from({ length: 12 }, (_, m) =>
    average(rows.filter(r => r.date.getMonth() === m).map(r => r.rel))
  );

  createBarChart(
    document.getElementById("month-chart"),
    MONTH_NAMES,
    month
  );
}

function renderEvolutionChart(rows) {
  const container = document.getElementById("evolution-chart");
  container.innerHTML = '';

  const days = parseInt(document.getElementById("evolution-range").value);
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Filter and sort data
  const data = rows
    .filter(r => r.date >= cutoff)
    .sort((a, b) => a.date - b.date);

  // Group by day to get daily averages
  const dailyData = [];
  const grouped = new Map();

  data.forEach(r => {
    const key = r.date.toISOString().split('T')[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r.rel);
  });

  grouped.forEach((vals, dateStr) => {
    dailyData.push({
      date: new Date(dateStr),
      value: average(vals)
    });
  });

  dailyData.sort((a, b) => a.date - b.date);

  if (dailyData.length < 2) {
    container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #94a3b8;">Not enough data</div>';
    return;
  }

  // Dimensions
  const width = container.clientWidth;
  const height = 200;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const graphW = width - pad.left - pad.right;
  const graphH = height - pad.top - pad.bottom;

  // Scales
  const minTime = dailyData[0].date.getTime();
  const maxTime = dailyData[dailyData.length - 1].date.getTime();
  const timeRange = maxTime - minTime;

  const x = d => pad.left + ((d.date.getTime() - minTime) / timeRange) * graphW;
  const y = d => pad.top + graphH - (d.value * graphH); // value is 0-1

  // SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  // Gradients
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const stops = [0, 50, 75, 100];

  const createGradient = (id, opacity) => {
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", id);
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", `${pad.top + graphH}`);
    grad.setAttribute("x2", "0");
    grad.setAttribute("y2", `${pad.top}`);

    stops.forEach(p => {
      const { r, g, b } = getColorForPercentage(p);
      const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop.setAttribute("offset", `${p}%`);
      stop.setAttribute("stop-color", `rgb(${r},${g},${b})`);
      stop.setAttribute("stop-opacity", opacity);
      grad.appendChild(stop);
    });
    return grad;
  };

  defs.appendChild(createGradient("evo-line-grad", 1));
  defs.appendChild(createGradient("evo-area-grad", 0.3));
  svg.appendChild(defs);

  // Area path
  let pathD = `M ${pad.left} ${pad.top + graphH}`;
  dailyData.forEach(d => {
    pathD += ` L ${x(d)} ${y(d)}`;
  });
  pathD += ` L ${pad.left + graphW} ${pad.top + graphH} Z`;

  const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
  area.setAttribute("d", pathD);
  area.setAttribute("class", "evolution-area");
  area.setAttribute("fill", "url(#evo-area-grad)");
  svg.appendChild(area);

  // Grid lines (Horizontal)
  [0, 0.25, 0.5, 0.75, 1].forEach(tick => {
    const yPos = pad.top + graphH - (tick * graphH);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pad.left);
    line.setAttribute("y1", yPos);
    line.setAttribute("x2", pad.left + graphW);
    line.setAttribute("y2", yPos);
    line.setAttribute("class", "evolution-grid");
    svg.appendChild(line);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", pad.left - 5);
    text.setAttribute("y", yPos + 4);
    text.setAttribute("text-anchor", "end");
    text.setAttribute("class", "evolution-label");
    text.textContent = `${(tick * 100).toFixed(0)}%`;
    svg.appendChild(text);
  });

  // Line path
  let lineD = "";
  dailyData.forEach((d, i) => {
    lineD += `${i === 0 ? "M" : "L"} ${x(d)} ${y(d)}`;
  });

  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", lineD);
  line.setAttribute("class", "evolution-line");
  line.setAttribute("stroke", "url(#evo-line-grad)");
  svg.appendChild(line);

  // X Axis dates (approx 5 ticks)
  const numTicks = 5;
  for (let i = 0; i < numTicks; i++) {
    const time = minTime + (timeRange * (i / (numTicks - 1)));
    const date = new Date(time);
    const xPos = pad.left + ((time - minTime) / timeRange) * graphW;

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", xPos);
    text.setAttribute("y", height - 10);
    text.setAttribute("class", "evolution-label");
    text.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    svg.appendChild(text);
  }

  container.appendChild(svg);
}

load();