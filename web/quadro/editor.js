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
        { id: "pos_in", x: 28, y: 2, kind: "dc+", name: "+ entrada" },
        { id: "neg_in", x: 44, y: 2, kind: "dc-", name: "− entrada" },
        { id: "pos_out", x: 28, y: 138, kind: "dc+", name: "+ saída" },
        { id: "neg_out", x: 44, y: 138, kind: "dc-", name: "− saída" },
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
        { id: "neg", x: 48, y: 2, kind: "dc-", name: "−" },
        { id: "PE", x: 36, y: 138, kind: "pe", name: "Terra / PE" },
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
    charge_controller: {
      label: "Controlador MPPT",
      img: "/quadro/img/mppt-controller.png",
      w: 130,
      h: 150,
      terminals: [
        { id: "pv_pos", x: 22, y: 2, kind: "dc+", name: "PV+" },
        { id: "pv_neg", x: 42, y: 2, kind: "dc-", name: "PV−" },
        { id: "bat_pos", x: 22, y: 148, kind: "dc+", name: "BAT+" },
        { id: "bat_neg", x: 42, y: 148, kind: "dc-", name: "BAT−" },
        { id: "load_pos", x: 88, y: 148, kind: "dc+", name: "LOAD+" },
        { id: "load_neg", x: 108, y: 148, kind: "dc-", name: "LOAD−" },
        { id: "pe", x: 108, y: 2, kind: "pe", name: "Terra / PE" },
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
    pe: "#16a34a",
    "dc+": "#ef4444",
    "dc-": "#111827",
  };
  const PE_GREEN = KIND_COLOR.pe;

  const state = {
    nodes: [],
    wires: [],
    selected: null,
    wireFrom: null,
    reconnect: null,
    drag: null,
    boardData: null,
    equipment: [],
    cableProductId: null,
    uid: 1,
  };

  function uid(prefix) {
    return prefix + "-" + state.uid++;
  }

  function productById(id) {
    return state.equipment.find((item) => item.id === id) || null;
  }

  function productsForType(type) {
    if (type === "wire") return state.equipment.filter((item) => item.componentType === "wire");
    return state.equipment.filter((item) => item.componentType === type);
  }

  function cableProductFor(mm2, protectiveEarth = false) {
    const requested = Number(mm2 || 0);
    const matches = productsForType("wire")
      .filter((item) => Boolean(item.protectiveEarth) === protectiveEarth)
      .sort((a, b) => Number(a.sectionMm2 || 0) - Number(b.sectionMm2 || 0));
    return matches.find((item) => Number(item.sectionMm2 || 0) >= requested) || matches[matches.length - 1] || null;
  }

  function isProtectiveEarthWire(wire) {
    const from = findTerminal(wire.from.node, wire.from.term);
    const to = findTerminal(wire.to.node, wire.to.term);
    return from?.term.kind === "pe" || to?.term.kind === "pe";
  }

  function enforceProtectiveEarth(wire) {
    if (!wire || !isProtectiveEarthWire(wire)) return;
    const cable = cableProductFor(wire.mm2, true);
    wire.color = PE_GREEN;
    if (cable) {
      wire.productId = cable.id;
      wire.label = cable.name;
      wire.mm2 = cable.sectionMm2;
    }
  }

  function nearestProduct(type, currentA) {
    const products = productsForType(type).filter((item) => item.currentA);
    const need = Number(currentA || 0);
    const exact = products.find((item) => item.currentA === need);
    if (exact) return exact;
    return (
      products
        .filter((item) => item.currentA >= need)
        .sort((a, b) => a.currentA - b.currentA)[0] ||
      products.sort((a, b) => b.currentA - a.currentA)[0] ||
      null
    );
  }

  function connectedNodeIds(nodeId) {
    const ids = new Set();
    state.wires.forEach((w) => {
      if (w.from.node === nodeId) ids.add(w.to.node);
      if (w.to.node === nodeId) ids.add(w.from.node);
    });
    return ids;
  }

  function inferCircuitId(node) {
    if (node.circuitId) return node.circuitId;
    if (node.type === "battery" || node.type === "panel") {
      return node.type === "battery" ? "bat-cc" : "pv-cc";
    }
    if (node.type === "breaker_dc") {
      const linked = connectedNodeIds(node.id);
      if ([...linked].some((id) => state.nodes.find((n) => n.id === id)?.type === "battery")) return "bat-cc";
      if ([...linked].some((id) => state.nodes.find((n) => n.id === id)?.type === "panel")) return "pv-cc";
      if ([...linked].some((id) => state.nodes.find((n) => n.id === id)?.type === "dps_dc")) return "pv-cc";
    }
    if (node.type === "breaker_ac") {
      if (node.circuitId === "geral" || node.circuitId === "ac-carga") return node.circuitId;
      const linked = connectedNodeIds(node.id);
      if ([...linked].some((id) => state.nodes.find((n) => n.id === id)?.type === "inverter")) return "geral";
      if ([...linked].some((id) => state.nodes.find((n) => n.id === id)?.type === "busbar")) return "ac-carga";
      if ([...linked].some((id) => state.nodes.find((n) => n.id === id)?.type === "dr")) return "geral";
    }
    if (node.type === "dr" || node.type === "dps_ac") return "geral";
    if (node.type === "dps_dc") return "pv-cc";
    if (node.type === "busbar") return "ac-carga";
    return null;
  }

  function circuitForNode(node) {
    const id = inferCircuitId(node);
    return id ? circuitById(state.boardData, id) : null;
  }

  function nbrStatusForBreaker(node) {
    const ckt = circuitForNode(node);
    if (!ckt || !node.type?.startsWith("breaker")) return null;
    const product = productById(node.productId);
    const placed = Number(product?.currentA || node.inA || 0);
    const need = Number(ckt.breakerA || 0);
    const ib = Number(ckt.designA || 0);
    const ok = placed >= need && placed >= ib;
    const exact = placed === need;
    return {
      circuitId: ckt.id,
      ib,
      need,
      placed,
      mm2: ckt.mm2,
      ok,
      exact,
      product,
      guidance: ckt.guidance || ckt.rule,
      label: exact
        ? `NBR OK · In ${need} A`
        : ok
          ? `NBR · In ${placed} A (≥ ${need} A)`
          : `Trocar · use In ${need} A`,
    };
  }

  function applyBreakerRecommendation(node, ckt, { forceProduct = true } = {}) {
    if (!node || !ckt) return;
    const type = node.type === "breaker_ac" ? "breaker_ac" : "breaker_dc";
    node.circuitId = ckt.id;
    node.designA = ckt.designA;
    node.mm2 = ckt.mm2;
    node.recommendedIn = ckt.breakerA;
    node.inA = ckt.breakerA;
    if (forceProduct && (type === node.type || node.type?.startsWith("breaker"))) {
      const product = nearestProduct(node.type, ckt.breakerA);
      if (product) {
        node.productId = product.id;
        node.label = product.name;
        node.inA = product.currentA;
      }
    }
  }

  function productMeta(product) {
    if (!product) return "";
    return [
      product.brand,
      product.model,
      product.currentA ? product.currentA + " A" : null,
      product.poles ? product.poles + "P" : null,
      product.voltage || (product.voltageV ? product.voltageV + " V" : null),
      product.breakingCapacityKa ? product.breakingCapacityKa + " kA" : null,
      product.sectionMm2 ? product.sectionMm2 + " mm²" : null,
      product.capacityKwh ? product.capacityKwh + " kWh" : null,
      product.maxCurrentA ? "máx. " + product.maxCurrentA + " A" : null,
      product.nominalDischargeKa ? "In " + product.nominalDischargeKa + " kA" : null,
      product.maxDischargeKa ? "Imax " + product.maxDischargeKa + " kA" : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  async function loadEquipmentDb() {
    const response = await fetch("/quadro/equipment-db.json?v=5");
    if (!response.ok) throw new Error("Falha ao carregar banco de equipamentos");
    const data = await response.json();
    const electrical = data.items || [];
    let shared = [];
    try {
      const catRes = await fetch("/api/catalog");
      if (catRes.ok) {
        const cat = await catRes.json();
        shared = [
          ...(cat.batteries || []).map(catalogBatteryToEquip),
          ...(cat.inverters || []).map(catalogInverterToEquip),
          ...(cat.panels || []).map(catalogPanelToEquip),
        ];
      }
    } catch (_) {}
    // Catálogo da calculadora prevalece para baterias/inversores/painéis; mantém proteções/cabos do quadro.
    const sharedIds = new Set(shared.map((item) => item.id));
    const catalogIds = new Set(shared.map((item) => item.catalogId).filter(Boolean));
    const onlyElectrical = electrical.filter((item) => {
      if (sharedIds.has(item.id) || (item.catalogId && catalogIds.has(item.catalogId))) return false;
      if (["batteries", "inverters", "power"].includes(item.category) && item.componentType !== "wire") {
        // Evita duplicar genéricos do quadro quando o mesmo produto veio do /api/catalog.
        if (item.componentType === "battery" || item.componentType === "inverter" || item.componentType === "panel") {
          const key = `${item.brand}|${item.model}`.toLocaleLowerCase("pt-BR");
          return !shared.some((s) => `${s.brand}|${s.model}`.toLocaleLowerCase("pt-BR") === key);
        }
      }
      return true;
    });
    state.equipment = [...shared, ...onlyElectrical];
    renderLibrary();
    fillCableProducts();
  }

  function catalogBatteryToEquip(b) {
    return {
      id: b.id,
      catalogId: b.id,
      category: "batteries",
      componentType: "battery",
      brand: b.brand,
      model: b.model,
      name: `${b.brand} ${b.model}`,
      voltageV: b.voltage_v,
      capacityWh: b.capacity_wh,
      capacityKwh: b.capacity_wh ? Number((b.capacity_wh / 1000).toFixed(2)) : null,
      maxCurrentA: b.max_current_a || null,
      maxPowerW: b.max_power_w || null,
      recommendedPowerW: b.recommended_power_w || null,
      dodPct: b.dod_pct,
      image: b.image || "/quadro/img/battery.svg",
      source: b.product_url || b.source || b.brand_url || null,
      notes: b.notes || null,
    };
  }

  function catalogInverterToEquip(inv) {
    return {
      id: inv.id,
      catalogId: inv.id,
      category: "inverters",
      componentType: "inverter",
      brand: inv.brand,
      model: inv.model,
      name: `${inv.brand} ${inv.model}`,
      powerW: inv.power_w || null,
      image: inv.image || "/quadro/img/inverter.svg",
      source: inv.product_url || inv.source || inv.brand_url || null,
      notes: inv.notes || null,
    };
  }

  function catalogPanelToEquip(p) {
    return {
      id: p.id,
      catalogId: p.id,
      category: "power",
      componentType: "panel",
      brand: p.brand,
      model: p.model,
      name: `${p.brand} ${p.model}`,
      powerW: p.wp || p.power_w || null,
      image: p.image || "/quadro/img/panel.svg",
      source: p.product_url || p.source || p.brand_url || null,
      notes: p.notes || null,
    };
  }

  function renderLibrary() {
    const list = $("library-list");
    const query = ($("library-search").value || "").trim().toLocaleLowerCase("pt-BR");
    const category = $("library-category").value;
    const items = state.equipment.filter((item) => {
      if (category && item.category !== category) return false;
      const haystack = [item.name, item.brand, item.model, item.currentA, item.voltage, item.standard]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return !query || haystack.includes(query);
    });
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = '<p class="library-empty">Nenhum equipamento encontrado.</p>';
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "library-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.draggable = item.componentType !== "wire";
      card.dataset.productId = item.id;
      card.innerHTML = `
        <img src="${item.image || TYPES[item.componentType]?.img || "/quadro/img/busbar.svg"}" alt="">
        <span><strong>${item.name}</strong><small>${productMeta(item)}</small></span>
        ${item.source ? `<a class="library-source" href="${item.source}" target="_blank" rel="noopener noreferrer" title="Fonte oficial">↗</a>` : ""}
      `;
      card.addEventListener("click", (event) => {
        if (event.target.closest(".library-source")) return;
        if (item.componentType === "wire") {
          selectCableProduct(item.id);
          if (state.selected?.kind === "wire") applyProductToSelection(item);
          return;
        }
        addNode(item.componentType, 220 + Math.random() * 360, 180 + Math.random() * 200, {
          productId: item.id,
          label: item.name,
          inA: item.currentA || null,
          mm2: item.sectionMm2 || null,
        });
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          card.click();
        }
      });
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("application/x-equipment-id", item.id);
        event.dataTransfer.setData("text/plain", item.componentType);
      });
      list.appendChild(card);
    });
  }

  function fillCableProducts() {
    const select = $("wire-product");
    const cables = productsForType("wire");
    select.innerHTML = "";
    cables.forEach((cable) => {
      const option = document.createElement("option");
      option.value = cable.id;
      option.textContent = cable.name;
      select.appendChild(option);
    });
    if (cables[0]) selectCableProduct(cables[0].id);
  }

  function selectCableProduct(id) {
    const cable = productById(id);
    if (!cable || cable.componentType !== "wire") return;
    state.cableProductId = cable.id;
    $("wire-product").value = cable.id;
    if (cable.colors?.[0]) $("wire-color").value = cable.colors[0];
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
      pv_v: num("pv_v", 80),
      cable_ac_m: num("cable_ac_m", 15),
      cable_bat_m: num("cable_bat_m", 2),
      cable_pv_m: num("cable_pv_m", 15),
      board: src.board || null,
    };
  }

  function fillDemandForm(p) {
    $("load-w").value = Math.round(p.load_w);
    $("bat-draw").value = Math.round(p.battery_draw_w);
    $("bat-v").value = String([12, 24, 48].includes(p.battery_v) ? p.battery_v : 48);
    $("ac-v").value = String(p.ac_v === 127 ? 127 : 220);
    $("stc-w").value = Math.round(p.panel_stc_w);
    if ($("pv-v")) $("pv-v").value = Math.round(p.pv_v || 80);
    if ($("cable-ac-m")) $("cable-ac-m").value = Number(p.cable_ac_m) || 15;
    if ($("cable-bat-m")) $("cable-bat-m").value = Number(p.cable_bat_m) || 2;
    if ($("cable-pv-m")) $("cable-pv-m").value = Number(p.cable_pv_m) || 15;
  }

  function payload() {
    return {
      load_w: Number($("load-w").value) || 0,
      battery_draw_w: Number($("bat-draw").value) || 0,
      battery_v: Number($("bat-v").value) || 48,
      ac_v: Number($("ac-v").value) || 220,
      panel_stc_w: Number($("stc-w").value) || 0,
      pv_v: Number(($("pv-v") && $("pv-v").value) || 80),
      cable_ac_m: Number(($("cable-ac-m") && $("cable-ac-m").value) || 15),
      cable_bat_m: Number(($("cable-bat-m") && $("cable-bat-m").value) || 2),
      cable_pv_m: Number(($("cable-pv-m") && $("cable-pv-m").value) || 15),
    };
  }

  function addNode(type, x, y, extras = {}) {
    const def = TYPES[type];
    if (!def) return null;
    const product = productById(extras.productId);
    const node = {
      id: uid("n"),
      type,
      x: Math.round(x),
      y: Math.round(y),
      productId: extras.productId || null,
      label: extras.label || product?.name || def.label,
      inA: extras.inA || product?.currentA || null,
      designA: extras.designA != null ? extras.designA : null,
      mm2: extras.mm2 || product?.sectionMm2 || null,
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

  function setHint(text) {
    $("wire-hint").textContent = text;
  }

  function clearTransientWire() {
    state.wireFrom = null;
    state.reconnect = null;
    tempWire.setAttribute("visibility", "hidden");
  }

  function select(sel) {
    state.selected = sel;
    render();
    updateInspector();
  }

  function fillInspectorProducts(type, currentId) {
    const selectEl = $("insp-product");
    const products = productsForType(type);
    selectEl.innerHTML = "";
    const custom = document.createElement("option");
    custom.value = "";
    custom.textContent = "Personalizado / sem catálogo";
    selectEl.appendChild(custom);
    products.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.name;
      selectEl.appendChild(option);
    });
    selectEl.value = currentId || "";
  }

  function applyProductToSelection(product) {
    if (!state.selected || !product) return;
    if (state.selected.kind === "node") {
      const node = state.nodes.find((item) => item.id === state.selected.id);
      if (!node || product.componentType === "wire") return;
      node.type = product.componentType;
      node.productId = product.id;
      node.label = product.name;
      node.inA = product.currentA || null;
      node.mm2 = product.sectionMm2 || node.mm2;
      // Remove ligações cujos bornes não existem no novo tipo.
      const terms = new Set(TYPES[node.type].terminals.map((term) => term.id));
      state.wires = state.wires.filter(
        (wire) =>
          (wire.from.node !== node.id || terms.has(wire.from.term)) &&
          (wire.to.node !== node.id || terms.has(wire.to.term)),
      );
    } else {
      const wire = state.wires.find((item) => item.id === state.selected.id);
      if (!wire || product.componentType !== "wire") return;
      wire.productId = product.id;
      wire.label = product.name;
      wire.mm2 = product.sectionMm2 || wire.mm2;
      if (product.colors?.length && !product.colors.includes(wire.color)) wire.color = product.colors[0];
      enforceProtectiveEarth(wire);
    }
    render();
    updateInspector();
  }

  function updateInspector() {
    const empty = $("insp-empty");
    const body = $("insp-body");
    const guide = $("insp-nbr");
    if (!state.selected) {
      empty.hidden = false;
      body.hidden = true;
      if (guide) guide.hidden = true;
      return;
    }
    empty.hidden = true;
    body.hidden = false;
    if (state.selected.kind === "node") {
      const n = state.nodes.find((x) => x.id === state.selected.id);
      if (!n) return;
      const product = productById(n.productId);
      const status = nbrStatusForBreaker(n);
      const ckt = circuitForNode(n);
      $("insp-title").textContent = n.label;
      $("insp-meta").textContent = (productMeta(product) || TYPES[n.type].label) + " · " + n.id;
      fillInspectorProducts(n.type, n.productId);
      $("insp-label").value = n.label;
      $("insp-in").value = n.inA || "";
      $("insp-mm2").value = n.mm2 || "";
      $("insp-source").hidden = !product?.source;
      $("insp-source").href = product?.source || "#";
      if (guide) {
        if (status || ckt) {
          guide.hidden = false;
          guide.className = "insp-nbr " + (status ? (status.ok ? "ok" : "bad") : "info");
          guide.innerHTML = status
            ? `<strong>${status.label}</strong><br>Ib ${formatWireIb(status.ib)} A · In norma ${status.need} A · cabo ${String(status.mm2).replace(".", ",")} mm²<br><span class="hint">${status.guidance || ""}</span>`
            : `<strong>Circuito ${ckt.name}</strong><br>Ib ${formatWireIb(ckt.designA)} A · ${ckt.breakerLabel}<br><span class="hint">${ckt.guidance || ckt.rule}</span>`;
          $("insp-apply-nbr").hidden = !(n.type?.startsWith("breaker") && status && !status.exact);
        } else {
          guide.hidden = true;
          $("insp-apply-nbr").hidden = true;
        }
      }
    } else if (state.selected.kind === "wire") {
      const w = state.wires.find((x) => x.id === state.selected.id);
      if (!w) return;
      const product = productById(w.productId);
      const ckt = circuitById(state.boardData, w.circuitId);
      $("insp-title").textContent = w.label || "Cabo";
      $("insp-meta").textContent =
        (productMeta(product) ? productMeta(product) + " · " : "") +
        (w.designA != null
          ? "Ib " + (formatWireIb(w.designA) || w.designA) + " A · "
          : "") +
        w.from.node + "." + w.from.term + " → " + w.to.node + "." + w.to.term;
      fillInspectorProducts("wire", w.productId);
      $("insp-label").value = w.label || "Cabo";
      $("insp-in").value = "";
      $("insp-mm2").value = w.mm2 || "";
      $("insp-source").hidden = !product?.source;
      $("insp-source").href = product?.source || "#";
      if (guide) {
        if (ckt) {
          guide.hidden = false;
          guide.className = "insp-nbr info";
          guide.innerHTML = `<strong>${ckt.name}</strong><br>Ib ${formatWireIb(ckt.designA)} A · use ${ckt.breakerLabel} · cabo ${String(ckt.mm2).replace(".", ",")} mm²`;
          $("insp-apply-nbr").hidden = true;
        } else {
          guide.hidden = true;
          $("insp-apply-nbr").hidden = true;
        }
      }
    }
  }

  function formatWireIb(designA) {
    if (designA == null || designA === "") return null;
    const n = Number(designA);
    if (!Number.isFinite(n)) return null;
    return n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  }

  function wireLabelText(w) {
    const parts = [];
    if (w.mm2) {
      parts.push(Number(w.mm2).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mm²");
    }
    const ib = formatWireIb(w.designA);
    if (ib) parts.push("Ib " + ib + " A");
    return parts.join(" · ");
  }

  function shouldShowWireLabel(w, a, b) {
    const kind = a.term.kind || b.term.kind;
    // Um rótulo por par de polos do mesmo circuito (evita corrente duplicada sobreposta).
    if (kind === "dc-" || kind === "neutral") return false;
    if (kind === "pe") return false;
    // Se houver outro cabo no mesmo trecho (mesmos nós), só o de id menor exibe.
    const twin = state.wires.find((other) => {
      if (other.id === w.id) return false;
      if ((other.circuitId || "") !== (w.circuitId || "")) return false;
      const sameEnds =
        (other.from.node === w.from.node && other.to.node === w.to.node) ||
        (other.from.node === w.to.node && other.to.node === w.from.node);
      return sameEnds && other.id < w.id;
    });
    if (twin) return false;
    return Boolean(wireLabelText(w));
  }

  function drawWireLabel(w, a, b) {
    const label = wireLabelText(w);
    if (!label || !shouldShowWireLabel(w, a, b)) return;
    const midX = (a.world.x + b.world.x) / 2;
    const midY = (a.world.y + b.world.y) / 2;
    const dx = b.world.x - a.world.x;
    const dy = b.world.y - a.world.y;
    const len = Math.hypot(dx, dy) || 1;
    // Desloca o rótulo perpendicular ao cabo para não cobrir a linha.
    const offset = 14;
    const lx = midX - (dy / len) * offset;
    const ly = midY + (dx / len) * offset;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("pointer-events", "none");

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", lx);
    t.setAttribute("y", ly);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "middle");
    t.setAttribute("fill", "#0f172a");
    t.setAttribute("font-size", "11");
    t.setAttribute("font-weight", "700");
    t.setAttribute("font-family", "Segoe UI,Arial");
    t.textContent = label;
    g.appendChild(t);
    wiresG.appendChild(g);

    // Fundo calculado após medir o texto.
    try {
      const box = t.getBBox();
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", box.x - 5);
      bg.setAttribute("y", box.y - 3);
      bg.setAttribute("width", box.width + 10);
      bg.setAttribute("height", box.height + 6);
      bg.setAttribute("rx", 4);
      bg.setAttribute("fill", "#ffffff");
      bg.setAttribute("fill-opacity", "0.92");
      bg.setAttribute("stroke", "#cbd5e1");
      bg.setAttribute("stroke-width", "1");
      g.insertBefore(bg, t);
    } catch (_) {}
  }

  function render() {
    nodesG.innerHTML = "";
    wiresG.innerHTML = "";

    state.wires.forEach((w) => {
      enforceProtectiveEarth(w);
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
        select({ kind: "wire", id: w.id });
        setHint("Cabo selecionado. Clique numa ponta para reconectar, ou Delete para remover.");
      });
      wiresG.appendChild(path);
      drawWireLabel(w, a, b);
      const wireSelected = state.selected?.kind === "wire" && state.selected.id === w.id;
      [
        { end: "from", point: a.world },
        { end: "to", point: b.world },
      ].forEach(({ end, point }) => {
          const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          handle.setAttribute("cx", point.x);
          handle.setAttribute("cy", point.y);
          handle.setAttribute("r", wireSelected ? 8 : 5);
          handle.setAttribute("fill", w.color || "#a16207");
          handle.setAttribute("stroke", "#fff");
          handle.setAttribute("stroke-width", "2");
          handle.classList.add("wire-endpoint");
          if (state.reconnect?.wireId === w.id && state.reconnect.end === end) {
            handle.classList.add("reconnecting");
          }
          handle.addEventListener("mousedown", (event) => {
            event.stopPropagation();
            state.selected = { kind: "wire", id: w.id };
            const fixedEnd = end === "from" ? "to" : "from";
            const fixed = findTerminal(w[fixedEnd].node, w[fixedEnd].term);
            state.reconnect = { wireId: w.id, end };
            state.wireFrom = null;
            state.drag = null;
            tempWire.setAttribute("visibility", "visible");
            tempWire.setAttribute("d", `M ${fixed.world.x} ${fixed.world.y} L ${point.x} ${point.y}`);
            setHint("Ponta do cabo no mouse. Clique no novo borne/polo ou Esc para cancelar.");
            updateInspector();
            render();
          });
          wiresG.appendChild(handle);
      });
    });

    state.nodes.forEach((node) => {
      const def = TYPES[node.type];
      const product = productById(node.productId);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("transform", `translate(${node.x},${node.y})`);
      g.dataset.nodeId = node.id;
      g.style.cursor = "grab";

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
      const imageHref = product?.image || def.img;
      img.setAttribute("href", imageHref);
      img.setAttributeNS("http://www.w3.org/1999/xlink", "href", imageHref);
      img.setAttribute("width", def.w);
      img.setAttribute("height", def.h);
      img.setAttribute("preserveAspectRatio", "xMidYMid meet");
      g.appendChild(img);

      if (product && (node.type.startsWith("breaker") || node.type === "charge_controller" || node.type === "inverter") && /\.png(?:$|\?)/i.test(imageHref)) {
        const plate = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        plate.setAttribute("x", 7);
        plate.setAttribute("y", node.type === "inverter" ? 8 : 27);
        plate.setAttribute("width", def.w - 14);
        plate.setAttribute("height", node.type === "charge_controller" ? 52 : 45);
        plate.setAttribute("rx", 2);
        plate.setAttribute("fill", "#f8fafc");
        plate.setAttribute("fill-opacity", "0.96");
        plate.setAttribute("stroke", "#cbd5e1");
        plate.setAttribute("stroke-width", "0.7");
        g.appendChild(plate);

        const specs = document.createElementNS("http://www.w3.org/2000/svg", "text");
        specs.setAttribute("x", def.w / 2);
        specs.setAttribute("y", node.type === "inverter" ? 16 : 35);
        specs.setAttribute("text-anchor", "middle");
        specs.setAttribute("fill", "#111827");
        specs.setAttribute("font-family", "Arial,sans-serif");
        specs.setAttribute("font-size", "5.4");
        specs.setAttribute("font-weight", "700");
        const lines = [
          product.brand,
          product.model,
          node.type.startsWith("breaker")
            ? `In: ${product.currentA || node.inA || "—"} A${product.poles ? ` · ${product.poles}P` : ""}`
            : product.powerW
              ? `${product.powerW} W`
              : product.currentA
                ? `${product.currentA} A`
                : "",
          product.voltage || (product.voltageV ? `${product.voltageV} V` : ""),
          product.breakingCapacityKa ? `Icu: ${product.breakingCapacityKa} kA` : "",
        ].filter(Boolean);
        lines.forEach((line, index) => {
          const span = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          span.setAttribute("x", def.w / 2);
          span.setAttribute("dy", index ? "7.2" : "0");
          span.textContent = line.length > 22 ? line.slice(0, 21) + "…" : line;
          specs.appendChild(span);
        });
        g.appendChild(specs);
      }

      const tag = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tag.setAttribute("x", def.w / 2);
      tag.setAttribute("y", def.h + 14);
      tag.setAttribute("text-anchor", "middle");
      tag.setAttribute("fill", "#1c2430");
      tag.setAttribute("font-size", "11");
      tag.setAttribute("font-weight", "600");
      tag.setAttribute("font-family", "Segoe UI,Arial");
      const nbr = nbrStatusForBreaker(node);
      if (nbr) {
        tag.textContent = nbr.label;
        tag.setAttribute("fill", nbr.ok ? (nbr.exact ? "#15803d" : "#a16207") : "#b91c1c");
      } else {
        tag.textContent = product ? `${product.brand} ${product.model}` : node.label + (node.inA ? ` ${node.inA}A` : "");
      }
      g.appendChild(tag);

      if (nbr) {
        const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sub.setAttribute("x", def.w / 2);
        sub.setAttribute("y", def.h + 28);
        sub.setAttribute("text-anchor", "middle");
        sub.setAttribute("fill", "#64748b");
        sub.setAttribute("font-size", "10");
        sub.setAttribute("font-family", "Segoe UI,Arial");
        sub.textContent = `Ib ${formatWireIb(nbr.ib)} A · cabo ${String(nbr.mm2).replace(".", ",")} mm²`;
        g.appendChild(sub);
      }

      def.terminals.forEach((term) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", term.x);
        c.setAttribute("cy", term.y);
        c.setAttribute("r", state.reconnect || state.wireFrom ? 7 : 5.5);
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
        if (state.reconnect || state.wireFrom) return;
        select({ kind: "node", id: node.id });
        const p = svgPoint(e);
        state.drag = { id: node.id, ox: p.x - node.x, oy: p.y - node.y };
        setHint("Peça selecionada. Arraste para mover ou use Trocar item no inspetor.");
      });

      nodesG.appendChild(g);
    });

    renderWireTable();
  }

  function onTerminalClick(nodeId, termId, evt) {
    if (state.reconnect) {
      const wire = state.wires.find((item) => item.id === state.reconnect.wireId);
      if (wire) {
        wire[state.reconnect.end] = { node: nodeId, term: termId };
        enforceProtectiveEarth(wire);
      }
      state.reconnect = null;
      tempWire.setAttribute("visibility", "hidden");
      setHint("Cabo reconectado. Clique numa ponta para alterar novamente.");
      render();
      updateInspector();
      return;
    }
    const hit = findTerminal(nodeId, termId);
    if (!hit) return;
    if (!state.wireFrom) {
      state.wireFrom = { node: nodeId, term: termId };
      state.drag = null;
      tempWire.setAttribute("visibility", "visible");
      const p = hit.world;
      tempWire.setAttribute("d", `M ${p.x} ${p.y} L ${p.x} ${p.y}`);
      setHint("Início do cabo no mouse. Clique no borne de destino.");
      return;
    }
    if (state.wireFrom.node === nodeId && state.wireFrom.term === termId) {
      clearTransientWire();
      setHint("Ligação cancelada.");
      return;
    }
    const fromHit = findTerminal(state.wireFrom.node, state.wireFrom.term);
    const fromNode = state.nodes.find((n) => n.id === state.wireFrom.node);
    const selectedCable = productById(state.cableProductId);
    const protectiveEarth = fromHit?.term.kind === "pe" || hit.term.kind === "pe";
    const cableProduct = protectiveEarth
      ? cableProductFor(selectedCable?.sectionMm2 || fromNode?.mm2 || hit.node.mm2, true)
      : selectedCable;
    const color = protectiveEarth ? PE_GREEN : $("wire-color").value || KIND_COLOR[hit.term.kind] || "#a16207";
    const mm2 = cableProduct?.sectionMm2 || fromNode?.mm2 || hit.node.mm2 || null;
    const designA = fromNode?.designA != null ? fromNode.designA : hit.node.designA;
    const circuitId = fromNode?.circuitId || hit.node.circuitId || null;
    state.wires.push({
      id: uid("w"),
      from: { ...state.wireFrom },
      to: { node: nodeId, term: termId },
      color,
      mm2,
      designA: designA != null ? designA : null,
      circuitId,
      productId: cableProduct?.id || null,
      label: cableProduct?.name || "Cabo",
    });
    clearTransientWire();
    setHint("Cabo ligado. Clique numa ponta para mover a conexão.");
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
        <td>${w.mm2 ? String(w.mm2).replace(".", ",") + " mm²" : "—"}</td>
        <td>${formatWireIb(w.designA) ? "Ib " + formatWireIb(w.designA) + " A" : "—"}</td>`;
      tb.appendChild(tr);
    });
  }

  function renderNormTable(data) {
    const tb = $("ckt-table").querySelector("tbody");
    tb.innerHTML = "";
    (data.circuits || []).forEach((c) => {
      const tr = document.createElement("tr");
      if (!c.ok) tr.className = "bad";
      const kind = c.kind === "dc" ? "breaker_dc" : "breaker_ac";
      const product = nearestProduct(kind, c.breakerA);
      const productHint = product
        ? `${product.brand} ${product.model} (${product.currentA} A)`
        : c.breakerLabel;
      tr.innerHTML = `<td><strong>${c.name}</strong></td><td>${c.designA} A</td>
        <td>${c.breakerLabel}<div class="hint">Sugestão: ${productHint}</div></td>
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
    else {
      assignCircuitsFromTopology();
      applySizesToNodes(state.boardData);
      syncWiresFromBoard(state.boardData);
    }
    render();
    setHint("Dimensionado NBR: correntes Ib e disjuntores In atualizados em todos os circuitos.");
  }

  function circuitById(data, id) {
    return (data?.circuits || []).find((c) => c.id === id) || null;
  }

  function assignCircuitsFromTopology() {
    state.nodes.forEach((n) => {
      const inferred = inferCircuitId(n);
      if (inferred) n.circuitId = inferred;
    });
    state.wires.forEach((w) => {
      if (w.circuitId) return;
      const from = state.nodes.find((n) => n.id === w.from.node);
      const to = state.nodes.find((n) => n.id === w.to.node);
      w.circuitId = from?.circuitId || to?.circuitId || null;
    });
  }

  function syncWiresFromBoard(data) {
    state.wires.forEach((w) => {
      const from = state.nodes.find((n) => n.id === w.from.node);
      const to = state.nodes.find((n) => n.id === w.to.node);
      const circuitId = w.circuitId || from?.circuitId || to?.circuitId || inferCircuitId(from || {}) || inferCircuitId(to || {});
      const ckt = circuitById(data, circuitId);
      if (!ckt) return;
      w.circuitId = ckt.id;
      w.designA = ckt.designA;
      if (w.color !== PE_GREEN && !productById(w.productId)?.protectiveEarth) {
        w.mm2 = ckt.mm2;
        const cable = cableProductFor(ckt.mm2, false);
        if (cable) {
          w.productId = cable.id;
          w.label = cable.name;
        }
      }
    });
  }

  function applySizesToNodes(data) {
    const breakerTypes = new Set(["breaker_ac", "breaker_dc"]);
    data.circuits.forEach((c) => {
      const targets = state.nodes.filter((n) => {
        const cid = n.circuitId || inferCircuitId(n);
        return cid === c.id;
      });
      targets.forEach((node) => {
        node.circuitId = c.id;
        node.designA = c.designA;
        node.mm2 = c.mm2;
        node.recommendedIn = c.breakerA;
        if (breakerTypes.has(node.type)) {
          applyBreakerRecommendation(node, c, { forceProduct: true });
        } else if (node.type === "dr" && c.id === "geral") {
          node.inA = Math.max(Number(node.inA || 0), c.breakerA);
        }
      });

      // Garante pelo menos um disjuntor do circuito recebe o produto recomendado.
      if (!targets.some((n) => breakerTypes.has(n.type))) {
        const fallbackType = c.kind === "dc" ? "breaker_dc" : "breaker_ac";
        const orphan = state.nodes.find((n) => n.type === fallbackType && !n.circuitId);
        if (orphan) applyBreakerRecommendation(orphan, c, { forceProduct: true });
      }
    });

    const inv = state.nodes.find((n) => n.type === "inverter");
    if (inv) {
      const bat = circuitById(data, "bat-cc");
      const ac = circuitById(data, "ac-carga") || circuitById(data, "geral");
      inv.designADc = bat?.designA ?? null;
      inv.designAAc = ac?.designA ?? null;
      inv.designA = ac?.designA ?? bat?.designA ?? inv.designA;
      inv.mm2 = ac?.mm2 ?? inv.mm2;
    }
  }

  function seedFromBoard(data) {
    state.nodes = [];
    state.wires = [];
    state.uid = 1;
    const byId = {};
    const ck = Object.fromEntries(data.circuits.map((c) => [c.id, c]));
    const productExtra = (type, currentA) => {
      const product = nearestProduct(type, currentA);
      return product ? { productId: product.id, label: product.name } : {};
    };

    byId.panel = addNode("panel", 100, 220, {
      label: "String FV",
      circuitId: "pv-cc",
      mm2: ck["pv-cc"]?.mm2,
      designA: ck["pv-cc"]?.designA,
    });
    byId.dps_dc = addNode("dps_dc", 280, 160, {
      label: "DPS CC",
      circuitId: "pv-cc",
      mm2: ck["pv-cc"]?.mm2,
      designA: ck["pv-cc"]?.designA,
    });
    byId.dj_pv = addNode("breaker_dc", 400, 160, {
      ...productExtra("breaker_dc", ck["pv-cc"]?.breakerA || 40),
      circuitId: "pv-cc",
      inA: ck["pv-cc"]?.breakerA,
      mm2: ck["pv-cc"]?.mm2,
      designA: ck["pv-cc"]?.designA,
    });
    byId.battery = addNode("battery", 100, 420, {
      label: `Banco ${data.demand.batteryV}V`,
      circuitId: "bat-cc",
      mm2: ck["bat-cc"]?.mm2,
      designA: ck["bat-cc"]?.designA,
    });
    byId.dj_bat = addNode("breaker_dc", 280, 380, {
      ...productExtra("breaker_dc", ck["bat-cc"]?.breakerA || 25),
      circuitId: "bat-cc",
      inA: ck["bat-cc"]?.breakerA,
      mm2: ck["bat-cc"]?.mm2,
      designA: ck["bat-cc"]?.designA,
    });
    byId.inverter = addNode("inverter", 520, 400, {
      label: "Inversor",
      mm2: ck["ac-carga"]?.mm2,
      designA: ck["ac-carga"]?.designA,
      designADc: ck["bat-cc"]?.designA,
      designAAc: ck["ac-carga"]?.designA,
    });
    byId.dj_geral = addNode("breaker_ac", 760, 160, {
      ...productExtra("breaker_ac", ck.geral?.breakerA || 16),
      circuitId: "geral",
      inA: ck.geral?.breakerA,
      mm2: ck.geral?.mm2,
      designA: ck.geral?.designA,
    });
    byId.dr = addNode("dr", 880, 160, {
      label: "DR 30 mA",
      circuitId: "geral",
      mm2: ck.geral?.mm2,
      designA: ck.geral?.designA,
    });
    byId.dps_ac = addNode("dps_ac", 1020, 160, {
      label: "DPS AC",
      circuitId: "geral",
      mm2: ck.geral?.mm2,
      designA: ck.geral?.designA,
    });
    byId.dj_load = addNode("breaker_ac", 1160, 160, {
      ...productExtra("breaker_ac", ck["ac-carga"]?.breakerA || 6),
      circuitId: "ac-carga",
      inA: ck["ac-carga"]?.breakerA,
      mm2: ck["ac-carga"]?.mm2,
      designA: ck["ac-carga"]?.designA,
    });
    byId.bus = addNode("busbar", 760, 360, {
      label: "Barramento AC",
      circuitId: "ac-carga",
      mm2: ck["ac-carga"]?.mm2,
      designA: ck["ac-carga"]?.designA,
    });

    autoWireSystem(byId);
  }

  function wire(aNode, aTerm, bNode, bTerm, color, mm2, designA, circuitId) {
    const from = findTerminal(aNode.id, aTerm);
    const to = findTerminal(bNode.id, bTerm);
    const protectiveEarth = from?.term.kind === "pe" || to?.term.kind === "pe";
    const resolvedMm2 = mm2 || aNode.mm2 || bNode.mm2 || null;
    const resolvedDesignA =
      designA != null ? designA : aNode.designA != null ? aNode.designA : bNode.designA;
    const resolvedCircuit = circuitId || aNode.circuitId || bNode.circuitId || null;
    const cable = cableProductFor(resolvedMm2, protectiveEarth) || productById(state.cableProductId);
    state.wires.push({
      id: uid("w"),
      from: { node: aNode.id, term: aTerm },
      to: { node: bNode.id, term: bTerm },
      color: protectiveEarth ? PE_GREEN : color,
      mm2: resolvedMm2,
      designA: resolvedDesignA != null ? resolvedDesignA : null,
      circuitId: resolvedCircuit,
      productId: cable?.id || null,
      label: cable?.name || "Cabo",
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
      wire(panel, "pos", dps_dc, "pos", "#ef4444", panel.mm2, panel.designA, "pv-cc");
      wire(panel, "neg", dps_dc, "neg", "#111827", panel.mm2, panel.designA, "pv-cc");
    }
    if (dps_dc && dj_pv) {
      wire(dps_dc, "pos", dj_pv, "pos_in", "#ef4444", dj_pv.mm2, dj_pv.designA, "pv-cc");
      wire(dps_dc, "neg", dj_pv, "neg_in", "#111827", dj_pv.mm2, dj_pv.designA, "pv-cc");
    }
    if (dj_pv && inverter) {
      wire(dj_pv, "pos_out", inverter, "dc_pos", "#ef4444", dj_pv.mm2, dj_pv.designA, "pv-cc");
      wire(dj_pv, "neg_out", inverter, "dc_neg", "#111827", dj_pv.mm2, dj_pv.designA, "pv-cc");
    }
    if (battery && dj_bat) {
      wire(battery, "pos", dj_bat, "pos_in", "#ef4444", dj_bat.mm2, dj_bat.designA, "bat-cc");
      wire(battery, "neg", dj_bat, "neg_in", "#111827", dj_bat.mm2, dj_bat.designA, "bat-cc");
    }
    if (dj_bat && inverter) {
      wire(dj_bat, "pos_out", inverter, "dc_pos", "#ef4444", dj_bat.mm2, dj_bat.designA, "bat-cc");
      wire(dj_bat, "neg_out", inverter, "dc_neg", "#111827", dj_bat.mm2, dj_bat.designA, "bat-cc");
    }
    if (inverter && dj_geral) {
      wire(inverter, "ac_l", dj_geral, "L_in", "#a16207", dj_geral.mm2, dj_geral.designA, "geral");
      wire(inverter, "ac_n", dj_geral, "N_in", "#3b82f6", dj_geral.mm2, dj_geral.designA, "geral");
      wire(inverter, "pe", dps_ac || dj_geral, dps_ac ? "PE" : "N_out", PE_GREEN, 6, dj_geral.designA, "geral");
    }
    if (dj_geral && dr) {
      wire(dj_geral, "L_out", dr, "L_in", "#a16207", dj_geral.mm2, dj_geral.designA, "geral");
      wire(dj_geral, "N_out", dr, "N_in", "#3b82f6", dj_geral.mm2, dj_geral.designA, "geral");
    }
    if (dr && dps_ac) {
      wire(dr, "L_out", dps_ac, "L", "#a16207", dj_geral?.mm2, dj_geral?.designA, "geral");
      wire(dr, "N_out", dps_ac, "N", "#3b82f6", dj_geral?.mm2, dj_geral?.designA, "geral");
    }
    if (dr && dj_load) {
      wire(dr, "L_load", dj_load, "L_in", "#a16207", dj_load.mm2, dj_load.designA, "ac-carga");
      wire(dr, "N_load", dj_load, "N_in", "#3b82f6", dj_load.mm2, dj_load.designA, "ac-carga");
    }
    if (dj_load && bus) wire(dj_load, "L_out", bus, "t1", "#a16207", dj_load.mm2, dj_load.designA, "ac-carga");
    render();
  }

  function bind() {
    $("library-search").addEventListener("input", renderLibrary);
    $("library-category").addEventListener("change", renderLibrary);
    $("wire-product").addEventListener("change", () => selectCableProduct($("wire-product").value));
    svg.addEventListener("dragover", (e) => e.preventDefault());
    svg.addEventListener("drop", (e) => {
      e.preventDefault();
      const product = productById(e.dataTransfer.getData("application/x-equipment-id"));
      const type = product?.componentType || e.dataTransfer.getData("text/plain");
      const p = svgPoint(e);
      if (type !== "wire") {
        addNode(type, p.x - 30, p.y - 40, {
          productId: product?.id,
          label: product?.name,
          inA: product?.currentA,
          mm2: product?.sectionMm2,
        });
      }
    });

    svg.addEventListener("mousemove", (e) => {
      const p = svgPoint(e);
      if (state.drag && !state.reconnect && !state.wireFrom) {
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
      if (state.reconnect) {
        const wireItem = state.wires.find((item) => item.id === state.reconnect.wireId);
        const fixedEnd = state.reconnect.end === "from" ? "to" : "from";
        const fixed = wireItem && findTerminal(wireItem[fixedEnd].node, wireItem[fixedEnd].term);
        if (fixed) {
          tempWire.setAttribute("visibility", "visible");
          tempWire.setAttribute("d", `M ${fixed.world.x} ${fixed.world.y} L ${p.x} ${p.y}`);
        }
      }
    });
    window.addEventListener("mouseup", () => {
      state.drag = null;
    });
    svg.addEventListener("mousedown", () => {
      if (!state.reconnect && !state.wireFrom) select(null);
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        clearTransientWire();
        setHint("Clique numa peça para mover. Clique no cabo para selecionar. Clique numa ponta para reconectar.");
        render();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && state.selected) {
        const tag = (e.target && e.target.tagName) || "";
        if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
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
    $("insp-apply-nbr").addEventListener("click", () => {
      if (!state.selected || state.selected.kind !== "node") return;
      const n = state.nodes.find((x) => x.id === state.selected.id);
      if (!n?.type?.startsWith("breaker")) return;
      const ckt = circuitForNode(n);
      if (!ckt) return;
      applyBreakerRecommendation(n, ckt, { forceProduct: true });
      render();
      updateInspector();
      setHint(`Aplicado ${ckt.breakerLabel} no circuito ${ckt.name} (Ib ${formatWireIb(ckt.designA)} A).`);
    });
    $("insp-product").addEventListener("change", () => {
      const product = productById($("insp-product").value);
      if (product) applyProductToSelection(product);
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

  async function init() {
    fillDemandForm(readParams());
    bind();
    setHint("Clique numa peça para mover. Clique no cabo para selecionar. Clique numa ponta para reconectar.");
    try {
      await loadEquipmentDb();
    } catch (error) {
      $("library-list").innerHTML = `<p class="library-empty">${error.message}</p>`;
    }
    await autosize({ rebuild: true });
  }

  init();
})();
