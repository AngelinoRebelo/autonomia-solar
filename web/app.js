const $ = (id) => document.getElementById(id);

function fmtWh(n) {
  const v = Math.round(n);
  return v.toLocaleString("pt-BR") + " Wh";
}
function fmtW(n) {
  return Math.round(n).toLocaleString("pt-BR") + " W";
}

let catalog = { batteries: [], inverters: [] };
let last = null;

function currentBattery() {
  return catalog.batteries.find((x) => x.id === $("battery").value);
}
function currentInverter() {
  return catalog.inverters.find((x) => x.id === $("inverter").value);
}

function setOfficialLock(el, locked) {
  if (el.type === "range") {
    el.disabled = locked;
  } else {
    el.readOnly = locked;
  }
  el.classList.toggle("official", locked);
}

function applyOfficialBattery(b, { resetDod } = { resetDod: false }) {
  $("capacity").value = Math.round(b.capacity_wh);
  $("bat-eff").value = b.eff_pct;
  $("bat-eff-out").value = b.eff_pct;
  setOfficialLock($("capacity"), !b.custom);
  setOfficialLock($("bat-eff"), !b.custom);
  if (resetDod) {
    $("dod").value = b.dod_pct;
    $("dod-out").value = b.dod_pct;
  }
  const bits = [
    b.notes,
    `Capacidade oficial ${Math.round(b.capacity_wh)} Wh · eficiência ${b.eff_pct}%.`,
    b.source ? "Fonte: fabricante." : "",
  ];
  $("hint").textContent = bits.filter(Boolean).join(" ");
}

function applyOfficialInverter(i, { resetIdle } = { resetIdle: false }) {
  $("inv-eff").value = i.eff_pct;
  $("inv-eff-out").value = i.eff_pct;
  setOfficialLock($("inv-eff"), !i.custom);
  if (resetIdle) {
    $("idle").value = i.idle_w;
    $("idle-out").value = i.idle_w;
  }
  const extra = `Eficiência oficial do inversor ${i.eff_pct}%.`;
  $("hint").textContent = [$("hint").textContent, extra, i.notes].filter(Boolean).join(" ");
}

function fillSelects() {
  const prevBat = $("battery").value;
  const prevInv = $("inverter").value;
  const bat = $("battery");
  const inv = $("inverter");
  bat.innerHTML = "";
  inv.innerHTML = "";
  for (const b of catalog.batteries) {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = `${b.brand} — ${b.model}`;
    bat.appendChild(opt);
  }
  for (const i of catalog.inverters) {
    const opt = document.createElement("option");
    opt.value = i.id;
    opt.textContent = `${i.brand} — ${i.model}`;
    inv.appendChild(opt);
  }
  const first = !prevBat;
  if (prevBat && catalog.batteries.some((b) => b.id === prevBat)) bat.value = prevBat;
  if (prevInv && catalog.inverters.some((i) => i.id === prevInv)) inv.value = prevInv;
  const b = currentBattery() || catalog.batteries[0];
  const i = currentInverter() || catalog.inverters[0];
  if (b) applyOfficialBattery(b, { resetDod: first });
  if (i) applyOfficialInverter(i, { resetIdle: first });
}

async function loadCatalog(refresh) {
  const r = await fetch("/api/catalog?refresh=" + (refresh ? "1" : "0"));
  catalog = await r.json();
  fillSelects();
  const log = (catalog.fetch_log || []).join(" · ");
  const el = $("fetch-log");
  if (log) {
    el.hidden = false;
    el.textContent = (catalog.fetched_at ? `Catálogo ${catalog.fetched_at}: ` : "") + log;
  }
  await compute();
}

async function compute() {
  const params = new URLSearchParams({
    capacity_wh: $("capacity").value,
    modules: $("modules").value,
    dod_pct: $("dod").value,
    battery_eff_pct: $("bat-eff").value,
    inverter_eff_pct: $("inv-eff").value,
    idle_w: $("idle").value,
    load_w: $("load").value,
  });
  const r = await fetch("/api/compute?" + params.toString());
  last = await r.json();
  render(last);
}

function render(d) {
  $("card-total").textContent = fmtWh(d.nominal_wh);
  $("card-draw").textContent = fmtW(d.battery_draw_w);
  $("card-loss").textContent = fmtW(d.inverter_loss_w);
  $("res-hours").textContent = d.hours_label;
  $("res-util").textContent = fmtWh(d.useful_wh);
  const tot = d.nominal_wh || 1;
  $("bar-util").style.flex = String(Math.max(d.useful_wh, 0.01) / tot);
  $("bar-bat").style.flex = String(Math.max(d.battery_loss_wh, 0) / tot);
  $("bar-res").style.flex = String(Math.max(d.reserve_wh, 0.01) / tot);
  $("leg-util").textContent = fmtWh(d.useful_wh);
  $("leg-res").textContent = fmtWh(d.reserve_wh);
  $("leg-batloss").textContent = fmtWh(d.battery_loss_wh);
  drawChart(d);
}

function drawChart(d) {
  const c = $("chart");
  const ctx = c.getContext("2d");
  const w = c.width;
  const h = c.height;
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 52, r: 16, t: 18, b: 42 };
  const pts = d.curve || [];
  const maxH = Math.max(10, ...pts.map((p) => p.hours));
  const maxL = 3000;
  const xOf = (load) => pad.l + ((w - pad.l - pad.r) * load) / maxL;
  const yOf = (hr) => pad.t + (h - pad.t - pad.b) * (1 - hr / maxH);

  ctx.strokeStyle = "#d5dde5";
  ctx.fillStyle = "#5c6b7a";
  ctx.font = "12px Ubuntu, sans-serif";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    const hr = (maxH * i) / 6;
    const y = yOf(hr);
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(hr)), 8, y + 4);
  }
  for (let load = 0; load <= maxL; load += 500) {
    const x = xOf(load);
    ctx.fillText(String(load), x - 10, h - 18);
  }
  ctx.fillText("Autonomia (horas) ↑", 8, 14);
  ctx.fillText("Carga de consumo (W) →", w / 2 - 70, h - 4);

  ctx.beginPath();
  ctx.strokeStyle = "#2d8cf0";
  ctx.lineWidth = 2.4;
  pts.forEach((p, i) => {
    const x = xOf(p.load_w);
    const y = yOf(Math.min(p.hours, maxH));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const x = xOf(d.load_w);
  const y = yOf(Math.min(d.hours, maxH));
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#d64545";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.fillStyle = "#d64545";
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c2430";
  ctx.fillText(d.hours.toFixed(1) + "h", x + 8, y - 8);
}

function bind() {
  $("battery").addEventListener("change", () => {
    const b = currentBattery();
    if (b) applyOfficialBattery(b, { resetDod: false });
    compute();
  });
  $("inverter").addEventListener("change", () => {
    const i = currentInverter();
    if (i) applyOfficialInverter(i, { resetIdle: true });
    compute();
  });
  for (const id of ["dod", "bat-eff", "inv-eff", "idle", "load"]) {
    $(id).addEventListener("input", () => {
      $(id + "-out").value = $(id).value;
      compute();
    });
  }
  $("capacity").addEventListener("input", compute);
  $("modules").addEventListener("input", compute);
  $("btn-refresh").addEventListener("click", () => loadCatalog(true));
}

bind();
loadCatalog(false);
