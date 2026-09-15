/** Editor profissional interativo de quadro elétrico. */
(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $("board-svg");
  const nodesG = $("nodes");
  const wiresG = $("wires");
  const tempWire = $("temp-wire");

  const TYPES = {
    breaker_ac: {
      label: "Disjuntor AC",
      img: "/quadro/img/breaker-ac.svg",
      w: 72,
      h: 140,
      terminals: [
        { id: "L_in", x: 30, y: 2, kind: "phase", name: "L entrada" },
        { id: "N_in", x: 42, y: 2, kind: "neutral", name: "N entrada" },
        { id: "L_out", x: 30, y: 138, kind: "phase", name: "L saída" },
        { id: "N_out", x: 42, y: 138, kind: "neutral", name: "N saída" },
      ],
    },
    breaker_dc: {
      label: "Disjuntor CC",
      img: "/quadro/img/breaker-dc.svg",
      w: 72,
      h: 140,
      terminals: [
        { id: "pos_in", x: 36, y: 2, kind: "dc+", name: "+ entrada" },
        { id: "pos_out", x: 36, y: 138, kind: "dc+", name: "+ saída" },
      ],
    },
    dr: {
      label: "DR 30 mA",
      img: "/quadro/img/dr.svg",
      w: 90,
      h: 140,
      terminals: [
        { id: "L_in", x: 22, y: 2, kind: "phase", name: "L in" },
        { id: "N_in", x: 36, y: 2, kind: "neutral", name: "N in" },
        { id: "L_out", x: 54, y: 2, kind: "phase", name: "L out" },
        { id: "N_out", x: 68, y: 2, kind: "neutral", name: "N out" },
        { id: "L_load", x: 22, y: 138, kind: "phase", name: "L carga" },
        { id: "N_load", x: 36, y: 138, kind: "neutral", name: "N carga" },
      ],
    },
    dps_ac: {
      label: "DPS AC II",
      img: "/quadro/img/dps.svg",
      w: 72,
      h: 140,
      terminals: [
        { id: "L", x: 24, y: 2, kind: "phase", name: "L" },
        { id: "N", x: 36, y: 2, kind: "neutral", name: "N" },
        { id: "PE", x: 48, y: 2, kind: "pe", name: "PE" },
        { id: "PE_out", x: 36, y: 138, kind: "pe", name: "PE" },
      ],
    },
    dps_dc: {
      label: "DPS CC",
      img: "/quadro/img/dps.svg",
      w: 72,
      h: 140,
      terminals: [
        { id: "pos", x: 24, y: 2, kind: "dc+", name: "+" },
        { id: "neg", x: 36, y: 2, kind: "dc-", name: "−" },
        { id: "PE", x: 48, y: 2, kind: "pe", name: "PE" },
      ],
    },
    battery: {
      label: "Bateria",
      img: "/quadro/img/battery.svg",
      w: 120,
      h: 90,
      terminals: [
        { id: "pos", x: 14, y: 48, kind: "dc+", name: "+" },
        { id: "neg", x: 106, y: 48, kind: "dc-", name: "−" },
      ],
    },
    inverter: {
      label: "Inversor",
      img: "/quadro/img/inverter.svg",
      w: 140,
      h: 100,
      terminals: [
        { id: "dc_pos", x: 24, y: 70, kind: "dc+", name: "DC+" },
        { id: "dc_neg", x: 40, y: 70, kind: "dc-", name: "DC−" },
        { id: "pe", x: 70, y: 70, kind: "pe", name: "PE" },
        { id: "ac_l", x: 100, y: 70, kind: "phase", name: "AC L" },
        { id: "ac_n", x: 116, y: 70, kind: "neutral", name: "AC N" },
      ],
    },
    panel: {
      label: "String FV",
      img: "/quadro/img/panel.svg",
      w: 100,
      h: 70,
      terminals: [
        { id: "pos", x: 18, y: 62, kind: "dc+", name: "+" },
        { id: "neg", x: 82, y: 62, kind: "dc-", name: "−" },
      ],
    },
    busbar: {
      label: "Barramento",
      img: "/quadro/img/busbar.svg",
      w: 200,
      h: 28,
      terminals: [
        { id: "t1", x: 24, y: 14, kind: "phase", name: "1" },
        { id: "t2", x: 56, y: 14, kind: "phase", name: "2" },
        { id: "t3", x: 88, y: 14, kind: "phase", name: "3" },
        { id: "t4", x: 120, y: 14, kind: "phase", name: "4" },
        { id: "t5", x: 152, y: 14, kind: "phase", name: "5" },
        { id: "t6", x: 184, y: 14, kind: "phase", name: "6" },
      ],
    },
  };

  const KIND_COLOR = {
    phase: "#a16207",
    neutral: "#3b82f6",
    pe: "#22c55e",
    "dc+": "#ef4444",
    "dc-": "#111827",
  };

  const state = {
    tool: "select",
    nodes: [],
    wires: [],
    selected: null,
    wireFrom: null,
    drag: null,
    boardData: null,
    uid: 1,
  };

  function uid(prefix) {
    return prefix + "-" + state.uid++;
  }

  function readParams() {
    const q = new URLSearchParams(location.search);
    let stored = null;
    try {
      stored = JSON.parse(sessionStorage.getItem("autonomia-quadro") || "null");
    } catch (_) {}
    const src = stored || {};
    const num = (k, fb) => {
      const v = q.get(k);
      if (v != null && v !== "") return Number(v);
      if (src[k] != null) return Number(src[k]);
      return fb;
    };
    return {
      load_w: num("load_w", 350),
      battery_draw_w: num("battery_draw_w", 400),
      battery_v: num("battery_v", 48),
      ac_v: num("ac_v", 220),
      panel_stc_w: num("panel_stc_w", 2300),
      cable_ac_m: 15,
      cable_bat_m: 2,
      cable_pv_m: 15,
    };
  }

  function fillDemandForm(p) {
    $("load-w").value = Math.round(p.load_w);
    $("bat-draw").value = Math.round(p.battery_draw_w);
    $("bat-v").value = String([12, 24, 48].includes(p.battery_v) ? p.battery_v : 48);
    $("ac-v").value = String(p.ac_v === 127 ? 127 : 220);
    $("stc-w").value = Math.round(p.panel_stc_w);
  }

  function payload() {
    return {
      load_w: Number($("load-w").value) || 0,
      battery_draw_w: Number($("bat-draw").value) || 0,
      battery_v: Number($("bat-v").value) || 48,
      ac_v: Number($("ac-v").value) || 220,
      panel_stc_w: Number($("stc-w").value) || 0,
      cable_ac_m: 15,
      cable_bat_m: 2,
      cable_pv_m: 15,
    };
  }

  function addNode(type, x, y, extras = {}) {
    const def = TYPES[type];
    if (!def) return null;
    const node = {
      id: uid("n"),
      type,
      x: Math.round(x),
      y: Math.round(y),
      label: extras.label || def.label,
      inA: extras.inA || null,
      mm2: extras.mm2 || null,
      circuitId: extras.circuitId || null,
    };
    state.nodes.push(node);
    render();
    return node;
  }

  function terminalWorld(node, term) {
    return { x: node.x + term.x, y: node.y + term.y, kind: term.kind, name: term.name, id: term.id };
  }

  function findTerminal(nodeId, termId) {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const def = TYPES[node.type];
    const term = def.terminals.find((t) => t.id === termId);
    if (!term) return null;
    return { node, term, world: terminalWorld(node, term) };
  }

  function svgPoint(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM().inverse();
    return pt.matrixTransform(ctm);
  }

  function setTool(tool) {
    state.tool = tool;
    state.wireFrom = null;
    tempWire.setAttribute("visibility", "hidden");
    document.querySelectorAll(".tool").forEach((b) => b.classList.toggle("active", b.dataset.tool === tool));
    $("wire-hint").textContent =
      tool === "wire"
        ? "Modo cabo: clique num borne e depois no destino. Esc cancela."
        : tool === "delete"
          ? "Modo apagar: clique numa peça ou num cabo."
          : "Modo mover: arraste peças. Clique para inspecionar.";
  }

  function select(sel) {
    state.selected = sel;
    render();
    updateInspector();
  }

  function updateInspector() {
    const empty = $("insp-empty");
    const body = $("insp-body");
    if (!state.selected) {
      empty.hidden = false;
      body.hidden = true;
      return;
    }
    empty.hidden = true;
    body.hidden = false;
    if (state.selected.kind === "node") {
      const n = state.nodes.find((x) => x.id === state.selected.id);
      if (!n) return;
      $("insp-title").textContent = n.label;
      $("insp-meta").textContent = TYPES[n.type].label + " · " + n.id;
      $("insp-label").value = n.label;
      $("insp-in").value = n.inA || "";
      $("insp-mm2").value = n.mm2 || "";
    } else if (state.selected.kind === "wire") {
      const w = state.wires.find((x) => x.id === state.selected.id);
      if (!w) return;
      $("insp-title").textContent = "Cabo";
      $("insp-meta").textContent = w.from.node + "." + w.from.term + " → " + w.to.node + "." + w.to.term;
      $("insp-label").value = w.label || "Cabo";
      $("insp-in").value = "";
      $("insp-mm2").value = w.mm2 || "";
    }
  }

  function render() {
    nodesG.innerHTML = "";
    wiresG.innerHTML = "";

    state.wires.forEach((w) => {
      const a = findTerminal(w.from.node, w.from.term);
      const b = findTerminal(w.to.node, w.to.term);
      if (!a || !b) return;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const midY = (a.world.y + b.world.y) / 2;
      const d = `M ${a.world.x} ${a.world.y} C ${a.world.x} ${midY}, ${b.world.x} ${midY}, ${b.world.x} ${b.world.y}`;
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", w.color || "#a16207");
      path.setAttribute("stroke-width", w.selected || (state.selected && state.selected.id === w.id) ? "5" : "3.5");
      path.setAttribute("stroke-linecap", "round");
      path.dataset.wireId = w.id;
      path.style.cursor = "pointer";
      path.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (state.tool === "delete") {
          state.wires = state.wires.filter((x) => x.id !== w.id);
          select(null);
          return;
        }
        select({ kind: "wire", id: w.id });
      });
      wiresG.appendChild(path);
      if (w.mm2) {
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", (a.world.x + b.world.x) / 2);
        t.setAttribute("y", midY - 6);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("fill", "#475569");
        t.setAttribute("font-size", "11");
        t.setAttribute("font-family", "Segoe UI,Arial");
        t.textContent = w.mm2 + " mm²";
        wiresG.appendChild(t);
      }
    });

    state.nodes.forEach((node) => {
      const def = TYPES[node.type];
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("transform", `translate(${node.x},${node.y})`);
      g.dataset.nodeId = node.id;
      g.style.cursor = state.tool === "select" ? "grab" : "pointer";

      if (state.selected && state.selected.kind === "node" && state.selected.id === node.id) {
        const halo = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        halo.setAttribute("x", -4);
        halo.setAttribute("y", -4);
        halo.setAttribute("width", def.w + 8);
        halo.setAttribute("height", def.h + 8);
        halo.setAttribute("rx", 8);
        halo.setAttribute("fill", "none");
        halo.setAttribute("stroke", "#2d8cf0");
        halo.setAttribute("stroke-width", "2");
        halo.setAttribute("stroke-dasharray", "4 3");
        g.appendChild(halo);
      }

      const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
      img.setAttribute("href", def.img);
      img.setAttributeNS("http://www.w3.org/1999/xlink", "href", def.img);
      img.setAttribute("width", def.w);
      img.setAttribute("height", def.h);
      g.appendChild(img);

      const tag = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tag.setAttribute("x", def.w / 2);
      tag.setAttribute("y", def.h + 14);
      tag.setAttribute("text-anchor", "middle");
      tag.setAttribute("fill", "#1c2430");
      tag.setAttribute("font-size", "11");
      tag.setAttribute("font-weight", "600");
      tag.setAttribute("font-family", "Segoe UI,Arial");
      tag.textContent = node.label + (node.inA ? ` ${node.inA}A` : "");
      g.appendChild(tag);

      def.terminals.forEach((term) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", term.x);
        c.setAttribute("cy", term.y);
        c.setAttribute("r", state.tool === "wire" ? 7 : 5);
        c.setAttribute("fill", KIND_COLOR[term.kind] || "#64748b");
        c.setAttribute("stroke", "#fff");
        c.setAttribute("stroke-width", "1.5");
        c.style.cursor = "crosshair";
        c.dataset.nodeId = node.id;
        c.dataset.termId = term.id;
        c.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          onTerminalClick(node.id, term.id, e);
        });
        g.appendChild(c);
      });

      g.addEventListener("mousedown", (e) => {
        if (e.target.closest("circle")) return;
        e.stopPropagation();
        if (state.tool === "delete") {
          state.wires = state.wires.filter((w) => w.from.node !== node.id && w.to.node !== node.id);
          state.nodes = state.nodes.filter((n) => n.id !== node.id);
          select(null);
          return;
        }
        if (state.tool === "select") {
          select({ kind: "node", id: node.id });
          const p = svgPoint(e);
          state.drag = { id: node.id, ox: p.x - node.x, oy: p.y - node.y };
        }
      });

      nodesG.appendChild(g);
    });

    renderWireTable();
  }

  function onTerminalClick(nodeId, termId, evt) {
    if (state.tool !== "wire") {
      select({ kind: "node", id: nodeId });
      return;
    }
    const hit = findTerminal(nodeId, termId);
    if (!hit) return;
    if (!state.wireFrom) {
      state.wireFrom = { node: nodeId, term: termId };
      tempWire.setAttribute("visibility", "visible");
      const p = hit.world;
      tempWire.setAttribute("d", `M ${p.x} ${p.y} L ${p.x} ${p.y}`);
      $("wire-hint").textContent = "Bornes: origem marcada. Clique no borne de destino.";
      return;
    }
    if (state.wireFrom.node === nodeId && state.wireFrom.term === termId) {
      state.wireFrom = null;
      tempWire.setAttribute("visibility", "hidden");
      return;
    }
    const color = $("wire-color").value || KIND_COLOR[hit.term.kind] || "#a16207";
    const fromNode = state.nodes.find((n) => n.id === state.wireFrom.node);
    const mm2 = fromNode?.mm2 || hit.node.mm2 || null;
    state.wires.push({
      id: uid("w"),
      from: { ...state.wireFrom },
      to: { node: nodeId, term: termId },
      color,
      mm2,
      label: "Cabo",
    });
    state.wireFrom = null;
    tempWire.setAttribute("visibility", "hidden");
    render();
  }

  function renderWireTable() {
    const tb = $("wire-table").querySelector("tbody");
    tb.innerHTML = "";
    state.wires.forEach((w) => {
      const a = findTerminal(w.from.node, w.from.term);
      const b = findTerminal(w.to.node, w.to.term);
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${a ? a.node.label + " · " + a.term.name : "?"}</td>
        <td>${b ? b.node.label + " · " + b.term.name : "?"}</td>
        <td><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${w.color}"></span></td>
        <td>${w.mm2 ? w.mm2 + " mm²" : "—"}</td>`;
      tb.appendChild(tr);
    });
  }

  function renderNormTable(data) {
    const tb = $("ckt-table").querySelector("tbody");
    tb.innerHTML = "";
    (data.circuits || []).forEach((c) => {
      const tr = document.createElement("tr");
      if (!c.ok) tr.className = "bad";
      tr.innerHTML = `<td><strong>${c.name}</strong></td><td>${c.designA} A</td><td>${c.breakerLabel}</td>
        <td>${c.mm2} mm²</td><td>${c.ampacity} A</td><td>${c.dropPct}%</td><td>${c.rule}</td>`;
      tb.appendChild(tr);
    });
    const d = data.demand;
    $("d-load").textContent = Math.round(d.loadW).toLocaleString("pt-BR") + " W";
    $("d-draw").textContent = Math.round(d.batteryDrawW).toLocaleString("pt-BR") + " W";
    $("d-stc").textContent = Math.round(d.panelStcW).toLocaleString("pt-BR") + " W";
    $("d-batv").textContent = d.batteryV + " V";
  }

  async function autosize({ rebuild = false } = {}) {
    const r = await fetch("/api/quadro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    state.boardData = await r.json();
    renderNormTable(state.boardData);
    if (rebuild || state.nodes.length === 0) seedFromBoard(state.boardData);
    else applySizesToNodes(state.boardData);
    render();
  }

  function applySizesToNodes(data) {
    const map = {
      geral: (c) => ({ inA: c.breakerA, mm2: c.mm2, label: `Geral ${c.breakerA}A` }),
      "ac-carga": (c) => ({ inA: c.breakerA, mm2: c.mm2, label: `Carga ${c.breakerA}A` }),
      "bat-cc": (c) => ({ inA: c.breakerA, mm2: c.mm2, label: `Bat ${c.breakerA}A` }),
      "pv-cc": (c) => ({ inA: c.breakerA, mm2: c.mm2, label: `FV ${c.breakerA}A` }),
    };
    data.circuits.forEach((c) => {
      const fn = map[c.id];
      if (!fn) return;
      const node = state.nodes.find((n) => n.circuitId === c.id);
      if (node) Object.assign(node, fn(c));
    });
  }

  function seedFromBoard(data) {
    state.nodes = [];
    state.wires = [];
    state.uid = 1;
    const byId = {};
    const ck = Object.fromEntries(data.circuits.map((c) => [c.id, c]));

    byId.panel = addNode("panel", 100, 220, { label: "String FV", circuitId: "pv-cc", mm2: ck["pv-cc"]?.mm2 });
    byId.dps_dc = addNode("dps_dc", 280, 160, { label: "DPS CC", circuitId: "pv-cc" });
    byId.dj_pv = addNode("breaker_dc", 400, 160, {
      label: `FV ${ck["pv-cc"]?.breakerA || 40}A`,
      circuitId: "pv-cc",
      inA: ck["pv-cc"]?.breakerA,
      mm2: ck["pv-cc"]?.mm2,
    });
    byId.battery = addNode("battery", 100, 420, { label: `Banco ${data.demand.batteryV}V`, circuitId: "bat-cc", mm2: ck["bat-cc"]?.mm2 });
    byId.dj_bat = addNode("breaker_dc", 280, 380, {
      label: `Bat ${ck["bat-cc"]?.breakerA || 25}A`,
      circuitId: "bat-cc",
      inA: ck["bat-cc"]?.breakerA,
      mm2: ck["bat-cc"]?.mm2,
    });
    byId.inverter = addNode("inverter", 520, 400, { label: "Inversor", mm2: ck["ac-carga"]?.mm2 });
    byId.dj_geral = addNode("breaker_ac", 760, 160, {
      label: `Geral ${ck.geral?.breakerA || 16}A`,
      circuitId: "geral",
      inA: ck.geral?.breakerA,
      mm2: ck.geral?.mm2,
    });
    byId.dr = addNode("dr", 880, 160, { label: "DR 30 mA" });
    byId.dps_ac = addNode("dps_ac", 1020, 160, { label: "DPS AC" });
    byId.dj_load = addNode("breaker_ac", 1160, 160, {
      label: `Carga ${ck["ac-carga"]?.breakerA || 6}A`,
      circuitId: "ac-carga",
      inA: ck["ac-carga"]?.breakerA,
      mm2: ck["ac-carga"]?.mm2,
    });
    byId.bus = addNode("busbar", 760, 360, { label: "Barramento AC" });

    autoWireSystem(byId);
  }

  function wire(aNode, aTerm, bNode, bTerm, color, mm2) {
    state.wires.push({
      id: uid("w"),
      from: { node: aNode.id, term: aTerm },
      to: { node: bNode.id, term: bTerm },
      color,
      mm2: mm2 || aNode.mm2 || bNode.mm2 || null,
      label: "Cabo",
    });
  }

  function autoWireSystem(byId) {
    if (!byId) {
      byId = {};
      state.nodes.forEach((n) => {
        if (n.type === "panel") byId.panel = n;
        if (n.type === "battery") byId.battery = n;
        if (n.type === "inverter") byId.inverter = n;
        if (n.circuitId === "pv-cc" && n.type === "breaker_dc") byId.dj_pv = n;
        if (n.circuitId === "bat-cc" && n.type === "breaker_dc") byId.dj_bat = n;
        if (n.circuitId === "geral") byId.dj_geral = n;
        if (n.circuitId === "ac-carga") byId.dj_load = n;
        if (n.type === "dr") byId.dr = n;
        if (n.type === "dps_ac") byId.dps_ac = n;
        if (n.type === "dps_dc") byId.dps_dc = n;
        if (n.type === "busbar") byId.bus = n;
      });
    }
    state.wires = [];
    const { panel, dps_dc, dj_pv, battery, dj_bat, inverter, dj_geral, dr, dps_ac, dj_load, bus } = byId;
    if (panel && dps_dc) {
      wire(panel, "pos", dps_dc, "pos", "#ef4444", panel.mm2);
      wire(panel, "neg", dps_dc, "neg", "#111827", panel.mm2);
    }
    if (dps_dc && dj_pv) wire(dps_dc, "pos", dj_pv, "pos_in", "#ef4444", dj_pv.mm2);
    if (dj_pv && inverter) wire(dj_pv, "pos_out", inverter, "dc_pos", "#ef4444", dj_pv.mm2);
    if (battery && dj_bat) wire(battery, "pos", dj_bat, "pos_in", "#ef4444", dj_bat.mm2);
    if (dj_bat && inverter) wire(dj_bat, "pos_out", inverter, "dc_pos", "#ef4444", dj_bat.mm2);
    if (battery && inverter) wire(battery, "neg", inverter, "dc_neg", "#111827", dj_bat?.mm2);
    if (inverter && dj_geral) {
      wire(inverter, "ac_l", dj_geral, "L_in", "#a16207", dj_geral.mm2);
      wire(inverter, "ac_n", dj_geral, "N_in", "#3b82f6", dj_geral.mm2);
      wire(inverter, "pe", dps_ac || dj_geral, dps_ac ? "PE" : "N_out", "#22c55e");
    }
    if (dj_geral && dr) {
      wire(dj_geral, "L_out", dr, "L_in", "#a16207", dj_geral.mm2);
      wire(dj_geral, "N_out", dr, "N_in", "#3b82f6", dj_geral.mm2);
    }
    if (dr && dps_ac) {
      wire(dr, "L_out", dps_ac, "L", "#a16207");
      wire(dr, "N_out", dps_ac, "N", "#3b82f6");
    }
    if (dr && dj_load) {
      wire(dr, "L_load", dj_load, "L_in", "#a16207", dj_load.mm2);
      wire(dr, "N_load", dj_load, "N_in", "#3b82f6", dj_load.mm2);
    }
    if (dj_load && bus) wire(dj_load, "L_out", bus, "t1", "#a16207", dj_load.mm2);
    render();
  }

  function bind() {
    document.querySelectorAll(".tool").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
    document.querySelectorAll(".pal-item").forEach((btn) => {
      btn.addEventListener("click", () => addNode(btn.dataset.type, 200 + Math.random() * 400, 180));
      btn.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", btn.dataset.type);
      });
    });
    svg.addEventListener("dragover", (e) => e.preventDefault());
    svg.addEventListener("drop", (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("text/plain");
      const p = svgPoint(e);
      addNode(type, p.x - 30, p.y - 40);
    });

    svg.addEventListener("mousemove", (e) => {
      const p = svgPoint(e);
      if (state.drag) {
        const n = state.nodes.find((x) => x.id === state.drag.id);
        if (n) {
          n.x = Math.round(p.x - state.drag.ox);
          n.y = Math.round(p.y - state.drag.oy);
          render();
        }
      }
      if (state.wireFrom) {
        const a = findTerminal(state.wireFrom.node, state.wireFrom.term);
        if (a) {
          tempWire.setAttribute("visibility", "visible");
          tempWire.setAttribute("d", `M ${a.world.x} ${a.world.y} L ${p.x} ${p.y}`);
        }
      }
    });
    window.addEventListener("mouseup", () => {
      state.drag = null;
    });
    svg.addEventListener("mousedown", () => {
      if (state.tool === "select") select(null);
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        state.wireFrom = null;
        tempWire.setAttribute("visibility", "hidden");
      }
      if ((e.key === "Delete" || e.key === "Backspace") && state.selected) {
        if (state.selected.kind === "node") {
          const id = state.selected.id;
          state.wires = state.wires.filter((w) => w.from.node !== id && w.to.node !== id);
          state.nodes = state.nodes.filter((n) => n.id !== id);
        } else {
          state.wires = state.wires.filter((w) => w.id !== state.selected.id);
        }
        select(null);
      }
    });

    $("insp-apply").addEventListener("click", () => {
      if (!state.selected) return;
      if (state.selected.kind === "node") {
        const n = state.nodes.find((x) => x.id === state.selected.id);
        if (!n) return;
        n.label = $("insp-label").value || n.label;
        n.inA = Number($("insp-in").value) || null;
        n.mm2 = Number($("insp-mm2").value) || null;
      } else {
        const w = state.wires.find((x) => x.id === state.selected.id);
        if (!w) return;
        w.label = $("insp-label").value || w.label;
        w.mm2 = Number($("insp-mm2").value) || null;
      }
      render();
      updateInspector();
    });
    $("insp-delete").addEventListener("click", () => {
      if (!state.selected) return;
      if (state.selected.kind === "node") {
        const id = state.selected.id;
        state.wires = state.wires.filter((w) => w.from.node !== id && w.to.node !== id);
        state.nodes = state.nodes.filter((n) => n.id !== id);
      } else state.wires = state.wires.filter((w) => w.id !== state.selected.id);
      select(null);
    });

    $("btn-autosize").addEventListener("click", () => autosize({ rebuild: true }));
    $("btn-autowire").addEventListener("click", () => autoWireSystem());
    $("btn-clear-wires").addEventListener("click", () => {
      state.wires = [];
      render();
    });
    $("btn-print").addEventListener("click", () => window.print());
    $("btn-export").addEventListener("click", () => {
      const blob = new Blob(
        [JSON.stringify({ nodes: state.nodes, wires: state.wires, demand: payload(), board: state.boardData }, null, 2)],
        { type: "application/json" }
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "quadro-projeto.json";
      a.click();
    });
  }

  fillDemandForm(readParams());
  bind();
  setTool("select");
  autosize({ rebuild: true });
})();
