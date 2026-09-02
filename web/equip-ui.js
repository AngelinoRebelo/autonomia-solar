/** Seletor com miniatura + modal de produto (global, sem ES modules). */
(function (global) {
  function createEquipPicker({
    root,
    items,
    value,
    getLabel,
    getImage,
    onChange,
    onOpenDetail,
    placeholder,
  }) {
    placeholder = placeholder || "Selecione…";
    root.classList.add("equip-picker");
    root.innerHTML = "";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "equip-picker-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "equip-picker-menu hidden";
    menu.setAttribute("role", "listbox");

    let current = value || (items[0] && items[0].id) || "";

    function itemById(id) {
      return items.find((i) => i.id === id) || items[0];
    }

    function renderButton() {
      const item = itemById(current);
      if (!item) {
        btn.innerHTML = '<span class="equip-picker-label">' + placeholder + "</span>";
        return;
      }
      btn.innerHTML =
        '<img class="equip-thumb" src="' +
        getImage(item) +
        '" alt="" width="40" height="30" loading="lazy" />' +
        '<span class="equip-picker-label">' +
        getLabel(item) +
        "</span>" +
        '<span class="equip-picker-caret" aria-hidden="true">▾</span>';
    }

    function renderMenu() {
      menu.innerHTML = "";
      items.forEach((item) => {
        const opt = document.createElement("button");
        opt.type = "button";
        opt.className = "equip-picker-option" + (item.id === current ? " selected" : "");
        opt.setAttribute("role", "option");
        opt.dataset.id = item.id;
        opt.innerHTML =
          '<img class="equip-thumb" src="' +
          getImage(item) +
          '" alt="" width="44" height="33" loading="lazy" />' +
          '<span class="equip-picker-option-text"><strong>' +
          getLabel(item) +
          "</strong><em>" +
          (item.shop || item.brand || "") +
          '</em></span><span class="equip-picker-info" title="Detalhes">ⓘ</span>';
        opt.addEventListener("click", (e) => {
          if (e.target.closest(".equip-picker-info")) {
            e.preventDefault();
            e.stopPropagation();
            if (onOpenDetail) onOpenDetail(item);
            return;
          }
          current = item.id;
          renderButton();
          renderMenu();
          close();
          if (onChange) onChange(item);
        });
        menu.appendChild(opt);
      });
    }

    function open() {
      menu.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
    }

    function close() {
      menu.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const openNow = menu.classList.contains("hidden");
      document.querySelectorAll(".equip-picker-menu").forEach((m) => m.classList.add("hidden"));
      document.querySelectorAll(".equip-picker-btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
      if (openNow) open();
      else close();
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) close();
    });

    root.append(btn, menu);
    renderButton();
    renderMenu();

    return {
      getValue: () => current,
      setValue: (id) => {
        current = id;
        renderButton();
        renderMenu();
      },
    };
  }

  function ensureProductModal() {
    return document.getElementById("product-modal");
  }

  function closeProductModal() {
    const el = ensureProductModal();
    if (!el) return;
    el.classList.add("hidden");
    el.setAttribute("aria-hidden", "true");
  }

  function openProductModal(item, kind) {
    kind = kind || "Equipamento";
    const el = ensureProductModal();
    if (!el || !item) return;
    const img = item.image || item.imageUrl || "/img/panels/generic-panel.svg";
    el.querySelector("#product-modal-img").src = img;
    el.querySelector("#product-modal-img").alt = (item.brand || "") + " " + (item.model || "");
    el.querySelector("#product-modal-kind").textContent = kind;
    el.querySelector("#product-modal-title").textContent = ((item.brand || "") + " " + (item.model || "")).trim();
    el.querySelector("#product-modal-meta").textContent = [
      item.shop ? "Loja: " + item.shop : null,
      item.voltage_v ? item.voltage_v + " V" : null,
      item.capacity_wh ? (item.capacity_wh / 1000).toFixed(2).replace(".", ",") + " kWh" : null,
      item.wp ? item.wp + " Wp" : null,
      item.eff_pct != null && item.wp == null && item.capacity_wh == null ? "η " + item.eff_pct + "%" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    el.querySelector("#product-modal-notes").textContent = item.notes || "";

    const links = el.querySelector("#product-modal-links");
    const product = item.product_url || item.source || item.brand_url;
    const brand = item.brand_url;
    links.innerHTML = "";
    if (product) {
      links.innerHTML +=
        '<a class="btn primary" href="' +
        product +
        '" target="_blank" rel="noopener noreferrer">Abrir site do produto ↗</a>';
    }
    if (brand && brand !== product) {
      links.innerHTML +=
        '<a class="btn ghost" href="' + brand + '" target="_blank" rel="noopener noreferrer">Site do fabricante ↗</a>';
    }
    if (!product && !brand) {
      links.innerHTML = '<span class="hint">Sem link cadastrado para este modelo.</span>';
    }

    el.classList.remove("hidden");
    el.setAttribute("aria-hidden", "false");
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#product-modal [data-close]")) closeProductModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProductModal();
  });

  global.EquipUI = { createEquipPicker, ensureProductModal, openProductModal, closeProductModal };
})(window);
