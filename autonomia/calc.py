"""Autonomia de um banco de baterias atrás de um inversor."""

from __future__ import annotations


def useful_energy_wh(capacity_wh: float, dod_pct: float, battery_eff_pct: float) -> dict[str, float]:
    cap = max(0.0, float(capacity_wh))
    dod = min(100.0, max(0.0, float(dod_pct))) / 100.0
    bat = min(100.0, max(1.0, float(battery_eff_pct))) / 100.0
    after_dod = cap * dod
    reserve = cap - after_dod
    useful = after_dod * bat
    return {
        "nominal_wh": cap,
        "after_dod_wh": after_dod,
        "reserve_wh": reserve,
        "useful_wh": useful,
        "battery_loss_wh": after_dod - useful,
    }


def inverter_draw_w(load_w: float, inverter_eff_pct: float, idle_w: float) -> dict[str, float]:
    load = max(0.0, float(load_w))
    idle = max(0.0, float(idle_w))
    eta = min(99.5, max(40.0, float(inverter_eff_pct))) / 100.0
    conversion = load / eta
    conversion_loss = conversion - load
    total = conversion + idle
    return {
        "load_w": load,
        "idle_w": idle,
        "conversion_loss_w": conversion_loss,
        "inverter_loss_w": conversion_loss + idle,
        "battery_draw_w": total,
        "eta": eta,
    }


def autonomy_hours(useful_wh: float, battery_draw_w: float) -> float:
    if battery_draw_w <= 0.05:
        return 0.0
    return max(0.0, useful_wh / battery_draw_w)


def hours_label(hours: float) -> str:
    if hours <= 0:
        return "0h 00min"
    total_min = int(round(hours * 60))
    h, m = divmod(total_min, 60)
    if h >= 1000:
        return f"{h}h"
    return f"{h}h {m:02d}min"


def curve(useful_wh: float, inverter_eff_pct: float, idle_w: float, max_load_w: float = 3000.0, steps: int = 80) -> list[dict[str, float]]:
    points = []
    for i in range(steps + 1):
        load = max_load_w * i / steps
        draw = inverter_draw_w(load, inverter_eff_pct, idle_w)["battery_draw_w"]
        points.append({"load_w": load, "hours": autonomy_hours(useful_wh, draw)})
    return points


def compute(
    capacity_wh: float,
    dod_pct: float,
    battery_eff_pct: float,
    inverter_eff_pct: float,
    idle_w: float,
    load_w: float,
    modules: int = 1,
) -> dict:
    n = max(1, int(modules))
    energy = useful_energy_wh(capacity_wh * n, dod_pct, battery_eff_pct)
    inv = inverter_draw_w(load_w, inverter_eff_pct, idle_w)
    hours = autonomy_hours(energy["useful_wh"], inv["battery_draw_w"])
    return {
        "modules": n,
        **energy,
        **inv,
        "hours": hours,
        "hours_label": hours_label(hours),
        "curve": curve(energy["useful_wh"], inverter_eff_pct, idle_w),
    }
