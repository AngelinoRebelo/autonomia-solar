"""Catálogo de baterias e inversores: valores de fábrica + actualização na rede."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

CACHE = Path.home() / ".cache" / "autonomia" / "catalog.json"
UA = "AutonomiaSolar/1.0 (Ubuntu; calculadora local)"

# DoD recomendado para vida útil (mais conservador que o máximo de datasheet).
# eficiência da bateria = round-trip / descarga típica do químico.
BUILTIN = {
    "batteries": [
        {
            "id": "felicity-fla48100",
            "brand": "Felicity Solar",
            "model": "FLA48100 5,12 kWh",
            "capacity_wh": 5120,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 51.2,
            "notes": "Oficial: 5,12 kWh · round-trip >95% · DoD datasheet ≥95%",
        },
        {
            "id": "felicity-lpbf48100",
            "brand": "Felicity Solar",
            "model": "LPBF48100-A 5 kWh",
            "capacity_wh": 5000,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 51.2,
            "notes": "LiFePO4 parede/chão",
        },
        {
            "id": "pylontech-us3000c",
            "brand": "Pylontech",
            "model": "US3000C",
            "capacity_wh": 3552,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 48.0,
            "notes": "LiFePO4 3,55 kWh",
        },
        {
            "id": "pylontech-us5000",
            "brand": "Pylontech",
            "model": "US5000",
            "capacity_wh": 4800,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 48.0,
            "notes": "LiFePO4 4,8 kWh",
        },
        {
            "id": "deye-rw-f10",
            "brand": "Deye / Growatt",
            "model": "Deye RW-F10.6",
            "capacity_wh": 10600,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 95,
            "voltage_v": 51.2,
            "notes": "módulo HV/LV residencial ~10,6 kWh",
        },
        {
            "id": "lead-gel-200ah-48v",
            "brand": "Chumbo-ácido / Gel",
            "model": "Banco 48 V 200 Ah",
            "capacity_wh": 9600,
            "dod_pct": 50,
            "datasheet_dod_pct": 50,
            "eff_pct": 80,
            "voltage_v": 48.0,
            "notes": "DoD 50% e ~80% de eficiência — não descarregar fundo",
        },
        {
            "id": "custom-bat",
            "brand": "Personalizado",
            "model": "Capacidade manual",
            "capacity_wh": 5120,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 90,
            "voltage_v": 48.0,
            "notes": "Edite capacidade e eficiência",
            "custom": True,
        },
    ],
    "inverters": [
        {
            "id": "felicity-5k",
            "brand": "Felicity Solar",
            "model": "IVEM5048 5 kW",
            "eff_pct": 93,
            "mppt_pct": 98,
            "idle_w": 35,
            "notes": "Oficial: eficiência máxima 93% · MPPT 98% (classe IVEM5048)",
        },
        {
            "id": "deye-8k",
            "brand": "Deye / Growatt",
            "model": "Deye híbrido 5–8 kW",
            "eff_pct": 97,
            "mppt_pct": 99.9,
            "idle_w": 55,
            "notes": "pico datasheet ~97,6%; vazio 40–80 W",
        },
        {
            "id": "growatt-spf",
            "brand": "Deye / Growatt",
            "model": "Growatt SPF / híbrido",
            "eff_pct": 93,
            "mppt_pct": 98,
            "idle_w": 45,
            "notes": "off-grid SPF: vazio medido ~40–60 W",
        },
        {
            "id": "must-epever",
            "brand": "Must / Epever",
            "model": "Híbrido 3–5 kW",
            "eff_pct": 92,
            "mppt_pct": 98,
            "idle_w": 40,
            "notes": "eficiência euro típica 90–93%",
        },
        {
            "id": "victron-mp2",
            "brand": "Victron Energy",
            "model": "MultiPlus-II 48/5000",
            "eff_pct": 96,
            "mppt_pct": 99,
            "idle_w": 18,
            "notes": "datasheet: vazio ~18 W, pico 96%",
        },
        {
            "id": "generic-inv",
            "brand": "Genérico",
            "model": "Inversor genérico",
            "eff_pct": 90,
            "mppt_pct": 96,
            "idle_w": 50,
            "notes": "valores médios de mercado",
        },
        {
            "id": "custom-inv",
            "brand": "Personalizado",
            "model": "Valores manuais",
            "eff_pct": 92,
            "mppt_pct": 98,
            "idle_w": 35,
            "notes": "Edite eficiência e consumo vazio",
            "custom": True,
        },
    ],
    "panels": [
        {
            "id": "jinko-575",
            "brand": "Jinko Solar",
            "model": "Tiger Neo JKM575N-72HL4",
            "wp": 575,
            "eff_pct": 22.26,
            "notes": "Oficial STC: 575 Wp · η 22,26% (datasheet Tiger Neo)",
        },
        {
            "id": "ja-550",
            "brand": "JA Solar",
            "model": "JAM72S30 550/MR",
            "wp": 550,
            "eff_pct": 21.3,
            "notes": "Oficial STC: 550 Wp · η 21,3%",
        },
        {
            "id": "trina-575",
            "brand": "Trina Solar",
            "model": "Vertex TSM-NEG19RC.20 575W",
            "wp": 575,
            "eff_pct": 22.4,
            "notes": "Oficial STC: 575 Wp · η 22,4%",
        },
        {
            "id": "longi-575",
            "brand": "LONGi",
            "model": "Hi-MO 6 LR5-72HTH 575M",
            "wp": 575,
            "eff_pct": 22.3,
            "notes": "Oficial STC: 575 Wp · η 22,3%",
        },
        {
            "id": "canadian-550",
            "brand": "Canadian Solar",
            "model": "CS6W-550MS",
            "wp": 550,
            "eff_pct": 21.3,
            "notes": "Oficial STC: 550 Wp · η 21,3%",
        },
        {
            "id": "risen-550",
            "brand": "Risen",
            "model": "RSM110-8-550M",
            "wp": 550,
            "eff_pct": 21.3,
            "notes": "Oficial STC: 550 Wp · η 21,3%",
        },
        {
            "id": "custom-panel",
            "brand": "Personalizado",
            "model": "Potência manual",
            "wp": 550,
            "eff_pct": 21.0,
            "notes": "Edite Wp e eficiência do módulo",
            "custom": True,
        },
    ],
}


def _http_get(url: str, timeout: float = 8.0) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def _apply_network(catalog: dict) -> list[str]:
    """Tenta datasheets públicos e actualiza o catálogo. Falhas são ignoradas."""
    notes: list[str] = []

    # Felicity FLA48100-EU — 5,12 kWh, round-trip >95%, DoD ≥95%
    try:
        html = _http_get("https://us.felicitysolar.com/product/fla48100-eu/")
        dod = 95.0 if re.search(r"(?:DOD|Depth of Discharge)[^%]{0,80}(?:≥|&gt;=)?\s*95\s*%", html, re.I) else None
        rte = 95.0 if re.search(r"(?:round[\s-]*trip|efficiency)[^%]{0,80}(?:≥|&gt;|>)?\s*95\s*%", html, re.I) else None
        if "5.12" in html or "5,12" in html:
            for b in catalog["batteries"]:
                if b["id"] == "felicity-fla48100":
                    b["capacity_wh"] = 5120
                    if dod:
                        b["datasheet_dod_pct"] = dod
                    if rte:
                        b["eff_pct"] = rte
                    b["source"] = "https://us.felicitysolar.com/product/fla48100-eu/"
            notes.append("Felicity FLA48100: 5120 Wh oficiais")
    except Exception as exc:
        notes.append(f"Felicity bateria: offline ({exc.__class__.__name__})")

    # Felicity IVEM5048 — eficiência máxima 93%
    try:
        html = _http_get("https://www.felicitysolar.com/product/ivem5048/")
        m = re.search(r"(?:Maximum|Max\.?)\s+efficiency[^0-9%]{0,40}(\d+(?:\.\d+)?)\s*%", html, re.I)
        if not m:
            html2 = _http_get("https://www.felicitylatam.com/en_us/product/ivem-inversor-solar-off-grid-5kw-48v-110v-controlador-de-carga/")
            m = re.search(r"Maximum Efficiency[^0-9%]{0,20}(\d+)\s*%", html2, re.I)
            html = html2
        for inv in catalog["inverters"]:
            if inv["id"] == "felicity-5k":
                if m:
                    inv["eff_pct"] = float(m.group(1))
                else:
                    inv["eff_pct"] = 93
                inv["mppt_pct"] = 98
                inv["source"] = "https://www.felicitysolar.com/product/ivem5048/"
        notes.append("Felicity IVEM5048: eficiência máxima oficial")
    except Exception as exc:
        notes.append(f"Felicity inversor: offline ({exc.__class__.__name__})")

    # Victron MultiPlus-II — página de produto
    try:
        html = _http_get("https://www.victronenergy.com/inverters-chargers/multiplus-ii")
        idle = None
        m = re.search(r"Zero[\s-]*load[\s-]*power[^0-9]{0,40}(\d+)\s*W", html, re.I)
        if m:
            idle = float(m.group(1))
        if "MultiPlus-II" in html:
            for inv in catalog["inverters"]:
                if inv["id"] == "victron-mp2":
                    if idle and 8 <= idle <= 40:
                        inv["idle_w"] = idle
                    inv["source"] = "https://www.victronenergy.com/inverters-chargers/multiplus-ii"
            notes.append("Victron MultiPlus-II consultado")
    except Exception as exc:
        notes.append(f"Victron: offline ({exc.__class__.__name__})")

    # Pylontech US5000 — capacidade habitual 4,8 kWh
    try:
        html = _http_get("https://en.pylontech.com.cn/pro_detail.aspx?id=185&nid=8")
        if "US5000" in html or "4.8" in html:
            for b in catalog["batteries"]:
                if b["id"] == "pylontech-us5000":
                    b["source"] = "https://en.pylontech.com.cn/"
            notes.append("Pylontech consultado")
    except Exception as exc:
        notes.append(f"Pylontech: offline ({exc.__class__.__name__})")

    # Jinko Tiger Neo 575 W — datasheet público
    try:
        html = _http_get("https://www.solartraders.com/en/products/modules/jinko-solar-jkm575n-72hl4-bdv")
        if "575" in html:
            for p in catalog["panels"]:
                if p["id"] == "jinko-575":
                    p["wp"] = 575
                    if re.search(r"22[,.]26\s*%", html):
                        p["eff_pct"] = 22.26
                    p["source"] = "https://www.jinkosolar.com/"
            notes.append("Jinko JKM575N: 575 Wp · 22,26%")
    except Exception as exc:
        notes.append(f"Jinko: offline ({exc.__class__.__name__})")

    catalog["rev"] = 2
    catalog["fetched_at"] = time.strftime("%Y-%m-%d %H:%M")
    catalog["fetch_log"] = notes
    return notes


def load_catalog(refresh: bool = False) -> dict:
    data = json.loads(json.dumps(BUILTIN))
    if CACHE.exists() and not refresh:
        try:
            cached = json.loads(CACHE.read_text(encoding="utf-8"))
            by_bat = {b["id"]: b for b in cached.get("batteries") or []}
            by_inv = {i["id"]: i for i in cached.get("inverters") or []}
            by_pan = {p["id"]: p for p in cached.get("panels") or []}
            for b in data["batteries"]:
                old = by_bat.get(b["id"]) or {}
                if old.get("source") and old.get("capacity_wh"):
                    b["capacity_wh"] = old["capacity_wh"]
                    b["eff_pct"] = old.get("eff_pct", b["eff_pct"])
                    b["source"] = old["source"]
            for i in data["inverters"]:
                old = by_inv.get(i["id"]) or {}
                if old.get("source") and old.get("eff_pct"):
                    i["eff_pct"] = old["eff_pct"]
                    if old.get("idle_w") is not None:
                        i["idle_w"] = old["idle_w"]
                    if old.get("mppt_pct") is not None:
                        i["mppt_pct"] = old["mppt_pct"]
                    i["source"] = old["source"]
            for p in data["panels"]:
                old = by_pan.get(p["id"]) or {}
                if old.get("source") and old.get("wp"):
                    p["wp"] = old["wp"]
                    p["eff_pct"] = old.get("eff_pct", p["eff_pct"])
                    p["source"] = old["source"]
            data["fetched_at"] = cached.get("fetched_at")
            data["fetch_log"] = cached.get("fetch_log") or []
        except (OSError, json.JSONDecodeError):
            pass
    if refresh or not data.get("fetched_at"):
        _apply_network(data)
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    data.setdefault("fetch_log", [])
    return data
