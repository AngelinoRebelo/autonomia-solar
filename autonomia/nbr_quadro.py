"""Dimensionamento orientativo de quadro — NBR 5410 / NBR 16690.

Não substitui projeto elétrico, ART nem parecer de concessionária.
"""

from __future__ import annotations

# Ampacidade aproximada NBR 5410 — PVC 70 °C, 2 condutores, método B1.
CABLE_TABLE = [
    {"mm2": 1.5, "amp": 17.5},
    {"mm2": 2.5, "amp": 24.0},
    {"mm2": 4.0, "amp": 32.0},
    {"mm2": 6.0, "amp": 41.0},
    {"mm2": 10.0, "amp": 57.0},
    {"mm2": 16.0, "amp": 76.0},
    {"mm2": 25.0, "amp": 101.0},
    {"mm2": 35.0, "amp": 125.0},
    {"mm2": 50.0, "amp": 151.0},
    {"mm2": 70.0, "amp": 192.0},
    {"mm2": 95.0, "amp": 232.0},
    {"mm2": 120.0, "amp": 269.0},
    {"mm2": 150.0, "amp": 309.0},
    {"mm2": 185.0, "amp": 353.0},
    {"mm2": 240.0, "amp": 415.0},
]

BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400]
CU_RESISTIVITY = 0.0178  # Ω·mm²/m a 20 °C


def next_breaker(ib: float) -> int:
    for r in BREAKER_RATINGS:
        if r >= ib:
            return r
    return BREAKER_RATINGS[-1]


def size_cable(current_a: float, length_m: float, voltage_v: float, drop_max: float = 0.025) -> dict:
    current = max(0.1, float(current_a))
    length = max(0.0, float(length_m))
    voltage = max(1.0, float(voltage_v))
    by_amp = next((r for r in CABLE_TABLE if r["amp"] >= current), CABLE_TABLE[-1])
    s_drop = (2 * length * current * CU_RESISTIVITY) / (voltage * drop_max) if drop_max > 0 else 0
    by_drop = next((r for r in CABLE_TABLE if r["mm2"] >= s_drop), CABLE_TABLE[-1])
    chosen = by_drop if by_drop["mm2"] >= by_amp["mm2"] else by_amp
    drop = (2 * length * current * CU_RESISTIVITY) / (chosen["mm2"] * voltage)
    return {
        "mm2": chosen["mm2"],
        "ampacity": chosen["amp"],
        "designA": round(current, 2),
        "dropPct": round(drop * 100, 2),
        "limitedBy": "queda de tensão" if by_drop["mm2"] > by_amp["mm2"] else "ampacidade",
    }


def size_circuit(ib: float, length_m: float, voltage_v: float, drop_max: float = 0.025, curve: str = "C") -> dict:
    """Ib → In (disjuntor) → S (cabo) com Iz ≥ In (NBR 5410)."""
    design = max(0.1, float(ib))
    breaker = next_breaker(design)
    cable = size_cable(max(design, breaker), length_m, voltage_v, drop_max)
    for row in CABLE_TABLE:
        if row["amp"] >= breaker and row["mm2"] >= cable["mm2"]:
            drop = (2 * float(length_m) * design * CU_RESISTIVITY) / (row["mm2"] * max(1.0, float(voltage_v)))
            cable = {
                "mm2": row["mm2"],
                "ampacity": row["amp"],
                "designA": round(design, 2),
                "dropPct": round(drop * 100, 2),
                "limitedBy": "Ib ≤ In ≤ Iz",
            }
            break
    ok = cable["ampacity"] >= breaker
    rule = f"Ib {design:.1f} A ≤ In {breaker} A ≤ Iz {cable['ampacity']} A"
    return {
        **cable,
        "breakerA": breaker,
        "breakerCurve": curve,
        "breakerLabel": f"DJ {breaker} A curva {curve}",
        "ok": ok,
        "rule": rule,
        "guidance": (
            f"Usar disjuntor In {breaker} A curva {curve} "
            f"(Ib {design:.1f} A). Cabo mín. {cable['mm2']} mm² (Iz {cable['ampacity']} A)."
        ),
    }


def build_board(
    load_w: float = 350,
    battery_draw_w: float = 400,
    battery_v: float = 48,
    ac_v: float = 220,
    panel_stc_w: float = 2300,
    pv_v: float = 80,
    cable_ac_m: float = 15,
    cable_bat_m: float = 2,
    cable_pv_m: float = 15,
    cable_mppt_m: float = 2,
    inverter_w: float = 0,
    inverter_eff_pct: float = 90,
    battery_max_a: float = 0,
    mppt_a: float = 0,
    mppt_eff_pct: float = 98,
    circuits_extra: list[dict] | None = None,
) -> dict:
    """Monta o quadro típico off-grid / híbrido a partir da demanda e do fluxo de energia.

    Trechos dimensionados (NBR 5410 / NBR 16690):
      1) FV → MPPT/inversor (pv-cc): corrente da string × 1,25
      2) MPPT → bateria (mppt-bat): corrente de carga (limitada pelo MPPT) × 1,25
      3) Bateria → inversor (bat-cc): dreno do inversor em plena carga × 1,25
      4) AC carga / geral
    """
    load = max(0.0, float(load_w))
    inv_w = max(0.0, float(inverter_w or 0))
    eta = min(99.5, max(40.0, float(inverter_eff_pct or 90))) / 100.0
    mppt_eta = min(99.5, max(80.0, float(mppt_eff_pct or 98))) / 100.0
    mppt_rated = max(0.0, float(mppt_a or 0))
    # Potência CA de projeto: maior entre carga informada e potência nominal do inversor.
    p_ac = max(load, inv_w)
    # Potência CC no banco (descarga): inversor em plena carga / η.
    p_dc_from_inv = (inv_w / eta) if inv_w > 0 else 0.0
    p_dc_from_load = (load / eta) if load > 0 else 0.0
    bat_draw = max(float(battery_draw_w or 0), p_dc_from_inv, p_dc_from_load, p_ac)
    ac = max(110.0, float(ac_v))
    bat_v = max(12.0, float(battery_v))
    stc = max(0.0, float(panel_stc_w))
    pv_bus = max(24.0, float(pv_v))

    # --- Correntes de projeto por trecho ---
    # AC (NBR 5410): fator 1,25 + FP 0,95
    ib_ac = (p_ac / (ac * 0.95)) * 1.25 if p_ac > 0 else 6
    # Bateria → inversor (descarga): Ib = P_cc / V_banco × 1,25
    ib_bat = (bat_draw / bat_v) * 1.25 if bat_draw > 0 else 10
    # FV → MPPT (NBR 16690): Imp ≈ P_STC/Vmp; proteção ≥ 1,25×Imp (aprox. Isc)
    ib_pv = (stc / pv_bus) * 1.25 if stc > 0 else 10
    # MPPT → bateria (carga): menor entre saída do MPPT e potência FV útil / V_banco
    p_charge = stc * mppt_eta if stc > 0 else 0.0
    i_charge_calc = (p_charge / bat_v) if p_charge > 0 else 0.0
    if mppt_rated > 0 and i_charge_calc > 0:
        i_charge = min(mppt_rated, i_charge_calc)
    elif mppt_rated > 0:
        i_charge = mppt_rated
    else:
        i_charge = i_charge_calc
    ib_mppt = max(i_charge * 1.25, 6.0) if (mppt_rated > 0 or stc > 0) else 0.0

    ac_ckt = size_circuit(ib_ac, cable_ac_m, ac, 0.025, "C")
    bat_ckt = size_circuit(ib_bat, cable_bat_m, bat_v, 0.01, "C")
    pv_ckt = size_circuit(ib_pv, cable_pv_m, pv_bus, 0.02, "C")
    mppt_ckt = size_circuit(ib_mppt, cable_mppt_m, bat_v, 0.01, "C") if ib_mppt > 0 else None
    geral = size_circuit(max(ib_ac * 1.1, 16), 1, ac, 0.03, "C")

    circuits = [
        {
            "id": "geral",
            "name": "Disjuntor geral AC",
            "kind": "ac",
            "role": "geral",
            "powerW": p_ac,
            "voltageV": ac,
            **geral,
            "protections": ["DPS classe II AC", "DR 30 mA (NBR 5410)"],
        },
        {
            "id": "ac-carga",
            "name": "Circuito de carga AC",
            "kind": "ac",
            "role": "carga",
            "powerW": p_ac,
            "voltageV": ac,
            "lengthM": cable_ac_m,
            **ac_ckt,
            "protections": ["Tomada / quadro de cargas"],
        },
        {
            "id": "bat-cc",
            "name": "Bateria → inversor (descarga CC)",
            "kind": "dc",
            "role": "bateria",
            "powerW": bat_draw,
            "voltageV": bat_v,
            "lengthM": cable_bat_m,
            **bat_ckt,
            "protections": ["DJ/fusível CC junto ao banco (lado inversor)"],
            "flow": "battery→inverter",
        },
        {
            "id": "pv-cc",
            "name": "String FV → MPPT / entrada FV",
            "kind": "dc",
            "role": "fv",
            "powerW": stc,
            "voltageV": pv_bus,
            "lengthM": cable_pv_m,
            **pv_ckt,
            "protections": ["DPS CC", "Seccionadora / gPV (NBR 16690)"],
            "flow": "pv→mppt",
        },
    ]
    if mppt_ckt:
        circuits.append(
            {
                "id": "mppt-bat",
                "name": "MPPT → bateria (carga CC)",
                "kind": "dc",
                "role": "carga-banco",
                "powerW": round(min(p_charge, mppt_rated * bat_v) if mppt_rated else p_charge, 1),
                "voltageV": bat_v,
                "lengthM": cable_mppt_m,
                **mppt_ckt,
                "protections": ["DJ CC entre controlador e banco"],
                "flow": "mppt→battery",
                "mpptRatedA": mppt_rated or None,
            }
        )

    for extra in circuits_extra or []:
        p = float(extra.get("powerW") or 0)
        v = float(extra.get("voltageV") or ac)
        L = float(extra.get("lengthM") or 10)
        ib = (p / (v * 0.95)) * 1.25 if p > 0 else 6
        sized = size_circuit(ib, L, v, 0.025, extra.get("curve") or "C")
        circuits.append(
            {
                "id": extra.get("id") or f"extra-{len(circuits)}",
                "name": extra.get("name") or "Circuito adicional",
                "kind": extra.get("kind") or "ac",
                "role": "extra",
                "powerW": p,
                "voltageV": v,
                "lengthM": L,
                **sized,
                "protections": extra.get("protections") or [],
            }
        )

    bom = []
    for c in circuits:
        bom.append(
            {
                "item": c["breakerLabel"],
                "qty": 1,
                "spec": c["rule"],
                "circuit": c["name"],
            }
        )
        bom.append(
            {
                "item": f"Cabo Cu {c['mm2']} mm² (Iz {c['ampacity']} A)",
                "qty": 1,
                "spec": f"ΔV {c['dropPct']}% · {c.get('lengthM', '—')} m · {c['limitedBy']}",
                "circuit": c["name"],
            }
        )
    bom.extend(
        [
            {"item": "DPS classe II AC", "qty": 1, "spec": "NBR 5410 / surtos", "circuit": "Proteção"},
            {"item": "DR 30 mA bipolo", "qty": 1, "spec": "NBR 5410 — choque", "circuit": "Proteção"},
            {"item": "DPS CC (string box)", "qty": 1, "spec": "NBR 16690", "circuit": "Proteção"},
            {"item": "Barramento / PE / aterramento", "qty": 1, "spec": "Equipotencialização", "circuit": "Proteção"},
        ]
    )

    ok = all(c.get("ok") for c in circuits)
    notes = [
        "Fluxo off-grid: FV → (DJ/DPS) → MPPT → bateria → (DJ) → inversor → AC.",
        "NBR 5410: Ib ≤ In ≤ Iz em cada trecho (corrente de projeto ≤ disjuntor ≤ ampacidade).",
        "NBR 16690: string FV protegida com fator 1,25 sobre a corrente da string.",
        "MPPT→bateria: corrente de carga limitada pelo controlador; bateria→inversor: P/η/V × 1,25.",
        "Queda de tensão: AC ≤ 2,5–4%; CC banco ≤ 1%; FV ≤ 2%.",
        "Valores orientativos — não substituem projeto, ART nem parecer da concessionária.",
    ]
    bat_max = max(0.0, float(battery_max_a or 0))
    if bat_max > 0 and ib_bat > bat_max:
        notes.insert(
            0,
            f"Atenção: Ib descarga ({ib_bat:.1f} A) excede a corrente máxima da bateria ({bat_max:.0f} A). "
            "Aumente banco em paralelo ou reduza a potência do inversor.",
        )
        for c in circuits:
            if c["id"] == "bat-cc":
                c["ok"] = False
                c["guidance"] = (
                    f"{c.get('guidance', '')} Limite da bateria: {bat_max:.0f} A."
                ).strip()

    return {
        "demand": {
            "loadW": load,
            "batteryDrawW": bat_draw,
            "batteryV": bat_v,
            "acV": ac,
            "panelStcW": stc,
            "pvV": pv_bus,
            "inverterW": inv_w,
            "inverterEffPct": round(eta * 100, 1),
            "dcPowerW": bat_draw,
            "acPowerW": p_ac,
            "batteryMaxA": bat_max or None,
            "mpptA": mppt_rated or None,
            "chargeA": round(i_charge, 2) if i_charge else None,
        },
        "circuits": circuits,
        "bom": bom,
        "ok": ok and not (bat_max > 0 and ib_bat > bat_max),
        "notes": notes,
        "normas": ["NBR 5410", "NBR 16690", "IEC 62548"],
    }
