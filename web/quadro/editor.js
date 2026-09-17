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
    return (
      products
        .filter((item) => item.currentA >= Number(currentA || 0))
        .sort((a, b) => a.currentA - b.currentA)[0] ||
      products.sort((a, b) => b.currentA - a.currentA)[0] ||
      null
    );
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
      product.nominalDischargeKa ? "In " + product.nominalDischargeKa + " kA" : null,
      product.maxDischargeKa ? "Imax " + product.maxDischargeKa + " kA" : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  async function loadEquipmentDb() {
    const response = await fetch("/quadro/equipment-db.json?v=3");
    if (!response.ok) throw new Error("Falha ao carregar banco de equipamentos");
    const data = await response.json();
    state.equipment = data.items || [];
    renderLibrary();
    fillCableProducts();
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
    const product = productById(extras.productId);
    const node = {
      id: uid("n"),
      type,
      x: Math.round(x),
      y: Math.round(y),
      productId: extras.productId || null,
      label: extras.label || product?.name || def.label,
      inA: extras.inA || product?.currentA || null,
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
      const product = productById(n.productId);
      $("insp-title").textContent = n.label;
      $("insp-meta").textContent = (productMeta(product) || TYPES[n.type].label) + " · " + n.id;
      fillInspectorProducts(n.type, n.productId);
      $("insp-label").value = n.label;
      $("insp-in").value = n.inA || "";
      $("insp-mm2").value = n.mm2 || "";
      $("insp-source").hidden = !product?.source;
      $("insp-source").href = product?.source || "#";
    } else if (state.selected.kind === "wire") {
      const w = state.wires.find((x) => x.id === state.selected.id);
      if (!w) return;
      const product = productById(w.productId);
      $("insp-title").textContent = w.label || "Cabo";
      $("insp-meta").textContent =
        (productMeta(product) ? productMeta(product) + " · " : "") +
        w.from.node + "." + w.from.term + " → " + w.to.node + "." + w.to.term;
      fillInspectorProducts("wire", w.productId);
      $("insp-label").value = w.label || "Cabo";
      $("insp-in").value = "";
      $("insp-mm2").value = w.mm2 || "";
      $("insp-source").hidden = !product?.source;
      $("insp-source").href = product?.source || "#";
    }
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
            ? `In: ${node.inA || product.currentA || "—"} A${product.poles ? ` · ${product.poles}P` : ""}`
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
      tag.textContent = product ? `${product.brand} ${product.model}` : node.label + (node.inA ? ` ${node.inA}A` : "");
      g.appendChild(tag);

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
    state.wires.push({
      id: uid("w"),
      from: { ...state.wireFrom },
      to: { node: nodeId, term: termId },
      color,
      mm2,
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
      geral: (c) => ({ inA: c.breakerA, mm2: c.mm2 }),
      "ac-carga": (c) => ({ inA: c.breakerA, mm2: c.mm2 }),
      "bat-cc": (c) => ({ inA: c.breakerA, mm2: c.mm2 }),
      "pv-cc": (c) => ({ inA: c.breakerA, mm2: c.mm2 }),
    };
    data.circuits.forEach((c) => {
      const fn = map[c.id];
      if (!fn) return;
      const node = state.nodes.find((n) => n.circuitId === c.id);
      if (node) {
        Object.assign(node, fn(c));
        if (node.type === "breaker_ac" || node.type === "breaker_dc") {
          const product = nearestProduct(node.type, c.breakerA);
          if (product) {
            node.productId = product.id;
            node.label = product.name;
          }
        }
      }
    });
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

    byId.panel = addNode("panel", 100, 220, { label: "String FV", circuitId: "pv-cc", mm2: ck["pv-cc"]?.mm2 });
    byId.dps_dc = addNode("dps_dc", 280, 160, { label: "DPS CC", circuitId: "pv-cc" });
    byId.dj_pv = addNode("breaker_dc", 400, 160, {
      ...productExtra("breaker_dc", ck["pv-cc"]?.breakerA || 40),
      circuitId: "pv-cc",
      inA: ck["pv-cc"]?.breakerA,
      mm2: ck["pv-cc"]?.mm2,
    });
    byId.battery = addNode("battery", 100, 420, { label: `Banco ${data.demand.batteryV}V`, circuitId: "bat-cc", mm2: ck["bat-cc"]?.mm2 });
    byId.dj_bat = addNode("breaker_dc", 280, 380, {
      ...productExtra("breaker_dc", ck["bat-cc"]?.breakerA || 25),
      circuitId: "bat-cc",
      inA: ck["bat-cc"]?.breakerA,
      mm2: ck["bat-cc"]?.mm2,
    });
    byId.inverter = addNode("inverter", 520, 400, { label: "Inversor", mm2: ck["ac-carga"]?.mm2 });
    byId.dj_geral = addNode("breaker_ac", 760, 160, {
      ...productExtra("breaker_ac", ck.geral?.breakerA || 16),
      circuitId: "geral",
      inA: ck.geral?.breakerA,
      mm2: ck.geral?.mm2,
    });
    byId.dr = addNode("dr", 880, 160, { label: "DR 30 mA" });
    byId.dps_ac = addNode("dps_ac", 1020, 160, { label: "DPS AC" });
    byId.dj_load = addNode("breaker_ac", 1160, 160, {
      ...productExtra("breaker_ac", ck["ac-carga"]?.breakerA || 6),
      circuitId: "ac-carga",
      inA: ck["ac-carga"]?.breakerA,
      mm2: ck["ac-carga"]?.mm2,
    });
    byId.bus = addNode("busbar", 760, 360, { label: "Barramento AC" });

    autoWireSystem(byId);
  }

  function wire(aNode, aTerm, bNode, bTerm, color, mm2) {
    const from = findTerminal(aNode.id, aTerm);
    const to = findTerminal(bNode.id, bTerm);
    const protectiveEarth = from?.term.kind === "pe" || to?.term.kind === "pe";
    const cable = cableProductFor(mm2, protectiveEarth) || productById(state.cableProductId);
    state.wires.push({
      id: uid("w"),
      from: { node: aNode.id, term: aTerm },
      to: { node: bNode.id, term: bTerm },
      color: protectiveEarth ? PE_GREEN : color,
      mm2: mm2 || aNode.mm2 || bNode.mm2 || null,
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
      wire(panel, "pos", dps_dc, "pos", "#ef4444", panel.mm2);
      wire(panel, "neg", dps_dc, "neg", "#111827", panel.mm2);
    }
    if (dps_dc && dj_pv) wire(dps_dc, "pos", dj_pv, "pos_in", "#ef4444", dj_pv.mm2);
    if (dps_dc && dj_pv) wire(dps_dc, "neg", dj_pv, "neg_in", "#111827", dj_pv.mm2);
    if (dj_pv && inverter) {
      wire(dj_pv, "pos_out", inverter, "dc_pos", "#ef4444", dj_pv.mm2);
      wire(dj_pv, "neg_out", inverter, "dc_neg", "#111827", dj_pv.mm2);
    }
    if (battery && dj_bat) {
      wire(battery, "pos", dj_bat, "pos_in", "#ef4444", dj_bat.mm2);
      wire(battery, "neg", dj_bat, "neg_in", "#111827", dj_bat.mm2);
    }
    if (dj_bat && inverter) {
      wire(dj_bat, "pos_out", inverter, "dc_pos", "#ef4444", dj_bat.mm2);
      wire(dj_bat, "neg_out", inverter, "dc_neg", "#111827", dj_bat.mm2);
    }
    if (inverter && dj_geral) {
      wire(inverter, "ac_l", dj_geral, "L_in", "#a16207", dj_geral.mm2);
      wire(inverter, "ac_n", dj_geral, "N_in", "#3b82f6", dj_geral.mm2);
      wire(inverter, "pe", dps_ac || dj_geral, dps_ac ? "PE" : "N_out", PE_GREEN);
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
