const PLACE_MAP = {
  1: "Alcobendas Principal",
  2: "Las Rozas Principal",
  4: "Legazpi Principal",
  5: "Chamberí Principal"
};


const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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
    langSel.add(new Option(l, l));
  });
  langSel.onchange = render;

  const placeSel = document.getElementById("place");
  Object.entries(PLACE_MAP).forEach(([id, name]) => {
    placeSel.add(new Option(name, id));
  });
  placeSel.value = 2;
  placeSel.onchange = render;
}

function initMonthSelector() {
  const box = document.getElementById("months");

  MONTH_NAMES.forEach((m, i) => {
    const label = document.createElement("label");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;

    cb.onchange = () => {
      cb.checked ? selectedMonths.add(i) : selectedMonths.delete(i);
      render();
    };

    label.append(cb, m);
    box.append(label);
  });
}

function relative(r) {
  return r.Ocupacion / r.Aforo;
}

function render() {
  const lang = document.getElementById("lang").value;
  const placeId = +document.getElementById("place").value;
  const t = i18n[lang];

  const rows = stats.flatMap(e =>
    e.data
        .filter(r => r.IdRecinto === placeId)
        .map(r => ({
        date: new Date(e.timestamp),
        rel: relative(r)
        }))
    );

  const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length || 0;

  const total = avg(rows.map(r => r.rel));

  document.getElementById("total").innerText =
    `${t.total}: ${(total*100).toFixed(1)}%`;

  // weekday
  const weekday = Array.from({length:7},(_,d)=>
    avg(rows.filter(r=>r.date.getDay()===d && selectedMonths.has(r.date.getMonth())).map(r=>r.rel))
  );
  document.getElementById("weekday").innerText =
    `${t.weekday}: ${weekday.map(v=>(v*100).toFixed(0)).join(" | ")}%`;

  // month
  const month = Array.from({length:12},(_,m)=>
    avg(rows.filter(r=>r.date.getMonth()===m).map(r=>r.rel))
  );
  document.getElementById("month").innerText =
    `${t.month}: ${month.map(v=>(v*100).toFixed(0)).join(" | ")}%`;
}

load();
