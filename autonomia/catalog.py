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
            "notes": "LiFePO4 · datasheet DoD ≥95%",
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
            "notes": "Edite capacidade, DoD e eficiência",
        },
    ],
    "inverters": [
        {
            "id": "felicity-5k",
            "brand": "Felicity Solar",
            "model": "Híbrido ~5 kW",
            "eff_pct": 92,
            "idle_w": 35,
            "notes": "pico ~93%; vazio típico 30–45 W",
        },
        {
            "id": "deye-8k",
            "brand": "Deye / Growatt",
            "model": "Deye híbrido 5–8 kW",
            "eff_pct": 97,
            "idle_w": 55,
            "notes": "pico datasheet ~97,6%; vazio 40–80 W",
        },
        {
            "id": "growatt-spf",
            "brand": "Deye / Growatt",
            "model": "Growatt SPF / híbrido",
            "eff_pct": 93,
            "idle_w": 45,
            "notes": "off-grid SPF: vazio medido ~40–60 W",
        },
        {
            "id": "must-epever",
            "brand": "Must / Epever",
            "model": "Híbrido 3–5 kW",
            "eff_pct": 92,
            "idle_w": 40,
            "notes": "eficiência euro típica 90–93%",
        },
        {
            "id": "victron-mp2",
            "brand": "Victron Energy",
            "model": "MultiPlus-II 48/5000",
            "eff_pct": 96,
            "idle_w": 18,
            "notes": "datasheet: vazio ~18 W, pico 96%",
        },
        {
            "id": "generic-inv",
            "brand": "Genérico",
            "model": "Inversor genérico",
            "eff_pct": 90,
            "idle_w": 50,
            "notes": "valores médios de mercado",
        },
        {
            "id": "custom-inv",
            "brand": "Personalizado",
            "model": "Valores manuais",
            "eff_pct": 92,
            "idle_w": 35,
            "notes": "Edite eficiência e consumo vazio",
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

    # Felicity FLA48100-EU — capacidade 5,12 kWh, DoD ≥95%
    try:
        html = _http_get("https://us.felicitysolar.com/product/fla48100-eu/")
        dod = 95.0 if re.search(r"(?:DOD|Depth of Discharge)[^%]{0,80}(?:≥|&gt;=)?\s*95\s*%", html, re.I) else None
        if "5.12" in html or "5,12" in html:
            for b in catalog["batteries"]:
                if b["id"] == "felicity-fla48100":
                    b["capacity_wh"] = 5120
                    if dod:
                        b["datasheet_dod_pct"] = dod
                    b["source"] = "https://us.felicitysolar.com/product/fla48100-eu/"
            notes.append("Felicity FLA48100 actualizado (felicitysolar.com)")
    except Exception as exc:
        notes.append(f"Felicity: offline ({exc.__class__.__name__})")

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

    catalog["fetched_at"] = time.strftime("%Y-%m-%d %H:%M")
    catalog["fetch_log"] = notes
    return notes


def load_catalog(refresh: bool = False) -> dict:
    data = json.loads(json.dumps(BUILTIN))
    if CACHE.exists() and not refresh:
        try:
            cached = json.loads(CACHE.read_text(encoding="utf-8"))
            if cached.get("batteries") and cached.get("inverters"):
                data = cached
        except (OSError, json.JSONDecodeError):
            pass
    if refresh or not data.get("fetched_at"):
        _apply_network(data)
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    data.setdefault("fetch_log", [])
    return data
