const PLACE_MAP = {
  1: "Alcobendas Principal",
  2: "Las Rozas Principal",
  4: "Legazpi Principal",
  5: "Chamberí Principal"
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  placeSel.value = 2;
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
    
    if (percentage < 50) {
      fill.classList.add("low");
    } else if (percentage < 75) {
      fill.classList.add("medium");
    } else {
      fill.classList.add("high");
    }
    
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
  const weekday = Array.from({length: 7}, (_, d) =>
    average(rows.filter(r => 
      r.date.getDay() === d && selectedMonths.has(r.date.getMonth())
    ).map(r => r.rel))
  );
  
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