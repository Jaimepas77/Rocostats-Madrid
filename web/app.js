const PLACE_MAP = {
  1: "Alcobendas Principal",
  2: "Las Rozas Principal",
  4: "Legazpi Principal",
  5: "Chamberí Principal"
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
      .filter(r => r.IdRecinto === placeId)
      .map(r => ({
        date: new Date(e.timestamp),
        rel: relative(r)
      }))
  );

  renderTotalAverage(rows);
  renderWeekdayChart(rows);
  renderMonthChart(rows);
}

function updateLabels(t) {
  document.getElementById("label-place").textContent = t.place;
  document.getElementById("label-total").textContent = t.total;
  document.getElementById("label-weekday").textContent = t.weekday;
  document.getElementById("label-month").textContent = t.month;
  document.getElementById("label-months").textContent = t.months;
}

function renderTotalAverage(rows) {
  const total = average(rows.map(r => r.rel));
  document.getElementById("total").textContent = `${(total * 100).toFixed(1)}%`;
}

function renderWeekdayChart(rows) {
  const weekday = Array.from({length: 7}, (_, d) => {
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
  const month = Array.from({length: 12}, (_, m) =>
    average(rows.filter(r => r.date.getMonth() === m).map(r => r.rel))
  );
  
  createBarChart(
    document.getElementById("month-chart"),
    MONTH_NAMES,
    month
  );
}

load();