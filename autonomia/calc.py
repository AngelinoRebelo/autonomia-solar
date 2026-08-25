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


def hours_label(hours: float | None) -> str:
    if hours is None or hours <= 0:
        return "0h 00min"
    if hours == float("inf"):
        return "—"
    total_min = int(round(hours * 60))
    h, m = divmod(total_min, 60)
    d, h = divmod(h, 24)
    if d >= 1:
        return f"{d}d {h}h {m:02d}min"
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


def pv_generation(
    panel_wp: float,
    panel_count: int,
    field_loss_pct: float,
    mppt_pct: float,
    battery_eff_pct: float,
    psh: float,
    after_dod_wh: float,
    battery_draw_w: float,
    idle_w: float,
) -> dict:
    """Geração FV → bateria, com perdas de campo, MPPT e carga."""
    n = max(0, int(panel_count))
    stc_w = n * max(0.0, float(panel_wp))
    field = 1.0 - min(60.0, max(0.0, float(field_loss_pct))) / 100.0
    mppt = min(99.9, max(50.0, float(mppt_pct))) / 100.0
    chg = min(100.0, max(1.0, float(battery_eff_pct))) / 100.0
    psh_h = max(0.0, float(psh))
    target = max(0.0, float(after_dod_wh))

    after_field_w = stc_w * field
    after_mppt_w = after_field_w * mppt
    field_loss_w = stc_w - after_field_w
    mppt_loss_w = after_field_w - after_mppt_w
    stored_pv_w = after_mppt_w * chg
    charge_loss_w = after_mppt_w - stored_pv_w

    def stored_rate(net_dc_w: float) -> float:
        return max(0.0, net_dc_w) * chg

    net_dc_peak = after_mppt_w - max(0.0, float(idle_w))
    net_dc_load = after_mppt_w - max(0.0, float(battery_draw_w))
    stored_peak_w = stored_rate(net_dc_peak)
    stored_load_w = stored_rate(net_dc_load)
    daily_wh = stored_pv_w * psh_h

    def charge_hours(rate_w: float) -> float | None:
        if rate_w <= 0.05:
            return None
        return target / rate_w

    h_peak = charge_hours(stored_peak_w)
    h_load = charge_hours(stored_load_w)
    days_psh = (target / daily_wh) if daily_wh > 0.05 else None

    return {
        "panel_count": n,
        "panel_wp": max(0.0, float(panel_wp)),
        "stc_w": stc_w,
        "after_field_w": after_field_w,
        "after_mppt_w": after_mppt_w,
        "field_loss_w": field_loss_w,
        "mppt_loss_w": mppt_loss_w,
        "charge_loss_w": charge_loss_w,
        "idle_w_charge": max(0.0, float(idle_w)),
        "stored_pv_w": stored_pv_w,
        "stored_peak_w": stored_peak_w,
        "stored_load_w": stored_load_w,
        "net_dc_peak_w": net_dc_peak,
        "net_dc_load_w": net_dc_load,
        "charges_with_load": net_dc_load > 0.05,
        "daily_wh": daily_wh,
        "psh": psh_h,
        "target_wh": target,
        "charge_hours_peak": h_peak,
        "charge_hours_load": h_load,
        "charge_days_psh": days_psh,
        "charge_hours_peak_label": hours_label(h_peak) if h_peak is not None else "não carrega",
        "charge_hours_load_label": hours_label(h_load) if h_load is not None else "não carrega",
        "charge_days_psh_label": (
            f"{days_psh:.1f} d de sol".replace(".", ",") if days_psh is not None else "—"
        ),
    }


def compute(
    capacity_wh: float,
    dod_pct: float,
    battery_eff_pct: float,
    inverter_eff_pct: float,
    idle_w: float,
    load_w: float,
    modules: int = 1,
    panel_wp: float = 575,
    panel_count: int = 4,
    field_loss_pct: float = 14,
    mppt_pct: float = 98,
    psh: float = 5.0,
) -> dict:
    n = max(1, int(modules))
    energy = useful_energy_wh(capacity_wh * n, dod_pct, battery_eff_pct)
    inv = inverter_draw_w(load_w, inverter_eff_pct, idle_w)
    hours = autonomy_hours(energy["useful_wh"], inv["battery_draw_w"])
    pv = pv_generation(
        panel_wp=panel_wp,
        panel_count=panel_count,
        field_loss_pct=field_loss_pct,
        mppt_pct=mppt_pct,
        battery_eff_pct=battery_eff_pct,
        psh=psh,
        after_dod_wh=energy["after_dod_wh"],
        battery_draw_w=inv["battery_draw_w"],
        idle_w=idle_w,
    )
    return {
        "modules": n,
        **energy,
        **inv,
        "hours": hours,
        "hours_label": hours_label(hours),
        "curve": curve(energy["useful_wh"], inverter_eff_pct, idle_w),
        "pv": pv,
    }
