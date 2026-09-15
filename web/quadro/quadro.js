const $ = (id) => document.getElementById(id);

let extras = [];
let boardData = null;

function fmtW(n) {
  return Math.round(n).toLocaleString("pt-BR") + " W";
}
function fmtV(n) {
  return Number(n).toLocaleString("pt-BR") + " V";
}

function readParams() {
  const q = new URLSearchParams(location.search);
  const stored = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("autonomia-quadro") || "null");
    } catch {
      return null;
    }
  })();
  const src = stored || {};
  const num = (key, fallback) => {
    const v = q.get(key);
    if (v != null && v !== "") return Number(v);
    if (src[key] != null) return Number(src[key]);
    return fallback;
  };
  return {
    load_w: num("load_w", 350),
    battery_draw_w: num("battery_draw_w", 400),
    battery_v: num("battery_v", 48),
    ac_v: num("ac_v", 220),
    panel_stc_w: num("panel_stc_w", 2300),
    cable_ac_m: num("cable_ac_m", 15),
    cable_bat_m: num("cable_bat_m", 2),
    cable_pv_m: num("cable_pv_m", 15),
  };
}

function fillForm(p) {
  $("load-w").value = Math.round(p.load_w);
  $("bat-draw").value = Math.round(p.battery_draw_w);
  $("bat-v").value = String([12, 24, 48].includes(p.battery_v) ? p.battery_v : 48);
  $("ac-v").value = String(p.ac_v === 127 ? 127 : 220);
  $("stc-w").value = Math.round(p.panel_stc_w);
  $("len-ac").value = p.cable_ac_m;
  $("len-bat").value = p.cable_bat_m;
  $("len-pv").value = p.cable_pv_m;
}

function formPayload() {
  return {
    load_w: Number($("load-w").value) || 0,
    battery_draw_w: Number($("bat-draw").value) || 0,
    battery_v: Number($("bat-v").value) || 48,
    ac_v: Number($("ac-v").value) || 220,
    panel_stc_w: Number($("stc-w").value) || 0,
    cable_ac_m: Number($("len-ac").value) || 15,
    cable_bat_m: Number($("len-bat").value) || 2,
    cable_pv_m: Number($("len-pv").value) || 15,
    circuits_extra: extras,
  };
}

async function sizeBoard() {
  const payload = formPayload();
  const r = await fetch("/api/quadro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  boardData = await r.json();
  render(boardData);
}

function render(data) {
  const d = data.demand;
  $("d-load").textContent = fmtW(d.loadW);
  $("d-draw").textContent = fmtW(d.batteryDrawW);
  $("d-stc").textContent = fmtW(d.panelStcW);
  $("d-batv").textContent = fmtV(d.batteryV);

  const tb = $("ckt-table").querySelector("tbody");
  tb.innerHTML = "";
  data.circuits.forEach((c) => {
    const tr = document.createElement("tr");
    if (!c.ok) tr.className = "bad";
    tr.innerHTML =
      "<td><strong>" +
      c.name +
      "</strong><br><small>" +
      (c.protections || []).join(" · ") +
      "</small></td>" +
      "<td>" +
      c.designA +
      " A</td>" +
      "<td>" +
      c.breakerLabel +
      "</td>" +
      "<td>" +
      c.mm2 +
      " mm²</td>" +
      "<td>" +
      c.ampacity +
      " A</td>" +
      "<td>" +
      c.dropPct +
      "%</td>" +
      "<td>" +
      c.rule +
      "</td>";
    tb.appendChild(tr);
  });

  const bom = $("bom-table").querySelector("tbody");
  bom.innerHTML = "";
  data.bom.forEach((b) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      b.item +
      "</td><td>" +
      b.qty +
      "</td><td>" +
      b.spec +
      "</td><td>" +
      b.circuit +
      "</td>";
    bom.appendChild(tr);
  });

  $("notes").innerHTML =
    "<h2>Notas de norma</h2><ul>" +
    data.notes.map((n) => "<li>" + n + "</li>").join("") +
    "<li>Referências: " +
    (data.normas || []).join(", ") +
    "</li></ul>";

  $("board-hint").textContent = data.ok
    ? "Quadro OK · Ib ≤ In ≤ Iz em todos os circuitos"
    : "Atenção: algum circuito viola Ib ≤ In ≤ Iz — aumente bitola ou revise a demanda";

  drawBoard(data);
}

function drawBoard(data) {
  const canvas = $("board");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Painel
  roundRect(ctx, 40, 30, w - 80, h - 60, 16, "#1f2933", "#0f141a");
  ctx.fillStyle = "#9aa7b5";
  ctx.font = "600 14px Ubuntu, sans-serif";
  ctx.fillText("QUADRO DE DISTRIBUIÇÃO — DIN", 60, 58);

  // Trilho DIN
  ctx.fillStyle = "#3d4a57";
  roundRect(ctx, 70, 90, w - 140, 36, 4, "#3d4a57");
  ctx.fillStyle = "#c5ccd4";
  ctx.font = "12px Ubuntu, sans-serif";
  ctx.fillText("Trilho DIN 35 mm", 80, 113);

  const slots = data.circuits.slice(0, 8);
  const slotW = Math.min(110, (w - 180) / Math.max(slots.length, 1) - 10);
  slots.forEach((c, i) => {
    const x = 80 + i * (slotW + 12);
    const y = 150;
    const color = c.kind === "dc" ? "#f59e0b" : "#3b82f6";
    roundRect(ctx, x, y, slotW, 120, 8, "#111827", color);
    ctx.fillStyle = "#e8eef5";
    ctx.font = "700 13px Ubuntu, sans-serif";
    ctx.fillText("DJ " + c.breakerA + "A", x + 10, y + 28);
    ctx.font = "11px Ubuntu, sans-serif";
    ctx.fillStyle = "#9fb0c3";
    wrapText(ctx, c.name, x + 10, y + 48, slotW - 16, 14);
    ctx.fillStyle = "#86efac";
    ctx.fillText(c.mm2 + " mm²", x + 10, y + 100);
    ctx.fillStyle = c.ok ? "#86efac" : "#fca5a5";
    ctx.fillText(c.ok ? "OK" : "REV", x + 10, y + 114);
  });

  // Proteções
  const py = 310;
  const protections = [
    { label: "DR 30 mA", color: "#22c55e" },
    { label: "DPS AC II", color: "#a855f7" },
    { label: "DPS CC", color: "#f97316" },
    { label: "PE / TERRA", color: "#94a3b8" },
  ];
  protections.forEach((p, i) => {
    const x = 80 + i * 180;
    roundRect(ctx, x, py, 160, 54, 8, "#111827", p.color);
    ctx.fillStyle = "#e8eef5";
    ctx.font = "600 13px Ubuntu, sans-serif";
    ctx.fillText(p.label, x + 14, py + 32);
  });

  // Barramentos / traçado
  ctx.strokeStyle = "#60a5fa";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 400);
  ctx.lineTo(w - 80, 400);
  ctx.stroke();
  ctx.fillStyle = "#93c5fd";
  ctx.font = "12px Ubuntu, sans-serif";
  ctx.fillText("Barramento fase / neutro (AC) — cabo dimensionado por circuito", 80, 424);

  ctx.strokeStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(80, 450);
  ctx.lineTo(w - 80, 450);
  ctx.stroke();
  ctx.fillStyle = "#fcd34d";
  ctx.fillText("Barramento CC (bateria / FV) — seccionamento junto ao banco (NBR 16690)", 80, 474);

  // Resumo
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "12px Ubuntu, sans-serif";
  const dem = data.demand;
  ctx.fillText(
    "Demanda: carga " +
      Math.round(dem.loadW) +
      " W · dreno " +
      Math.round(dem.batteryDrawW) +
      " W · FV " +
      Math.round(dem.panelStcW) +
      " Wp · banco " +
      dem.batteryV +
      " V",
    80,
    h - 50
  );
  ctx.fillText("Normas: " + (data.normas || []).join(" · "), 80, h - 30);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let yy = y;
  words.forEach((word) => {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else line = test;
  });
  if (line) ctx.fillText(line, x, yy);
}

function bind() {
  $("btn-size").addEventListener("click", sizeBoard);
  $("btn-print").addEventListener("click", () => window.print());
  $("btn-add").addEventListener("click", () => {
    extras.push({
      id: "extra-" + (extras.length + 1),
      name: $("ex-name").value || "Circuito extra",
      powerW: Number($("ex-w").value) || 0,
      lengthM: Number($("ex-len").value) || 10,
      voltageV: Number($("ac-v").value) || 220,
      kind: "ac",
    });
    sizeBoard();
  });
  ["load-w", "bat-draw", "bat-v", "ac-v", "stc-w", "len-ac", "len-bat", "len-pv"].forEach((id) => {
    $(id).addEventListener("change", sizeBoard);
  });
}

fillForm(readParams());
bind();
sizeBoard();
