from __future__ import annotations

import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from autonomia import calc, catalog, nbr_quadro

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        return

    def _json(self, payload: dict, code: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def end_headers(self) -> None:
        path = urlparse(self.path).path
        if path.endswith((".js", ".css", ".html", "/")) or path in ("", "/"):
            self.send_header("Cache-Control", "no-store, max-age=0")
        return super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/catalog":
            qs = parse_qs(urlparse(self.path).query)
            refresh = (qs.get("refresh") or ["0"])[0] in ("1", "true", "yes")
            data = catalog.load_catalog(refresh=refresh)
            self._json(data)
            return
        if path == "/api/compute":
            q = parse_qs(urlparse(self.path).query)

            def f(name: str, default: float) -> float:
                try:
                    return float((q.get(name) or [default])[0])
                except (TypeError, ValueError):
                    return float(default)

            result = calc.compute(
                capacity_wh=f("capacity_wh", 5120),
                dod_pct=f("dod_pct", 90),
                battery_eff_pct=f("battery_eff_pct", 95),
                inverter_eff_pct=f("inverter_eff_pct", 92),
                idle_w=f("idle_w", 35),
                load_w=f("load_w", 350),
                modules=int(f("modules", 1)),
                panel_wp=f("panel_wp", 575),
                panel_count=int(f("panel_count", 4)),
                field_loss_pct=f("field_loss_pct", 14),
                mppt_pct=f("mppt_pct", 98),
                psh=f("psh", 5.0),
            )
            self._json(result)
            return
        if path == "/api/quadro":
            q = parse_qs(urlparse(self.path).query)

            def f(name: str, default: float) -> float:
                try:
                    return float((q.get(name) or [default])[0])
                except (TypeError, ValueError):
                    return float(default)

            data = nbr_quadro.build_board(
                load_w=f("load_w", 350),
                battery_draw_w=f("battery_draw_w", 400),
                battery_v=f("battery_v", 48),
                ac_v=f("ac_v", 220),
                panel_stc_w=f("panel_stc_w", 2300),
                pv_v=f("pv_v", 80),
                cable_ac_m=f("cable_ac_m", 15),
                cable_bat_m=f("cable_bat_m", 2),
                cable_pv_m=f("cable_pv_m", 15),
                inverter_w=f("inverter_w", 0),
                inverter_eff_pct=f("inverter_eff_pct", 90),
                battery_max_a=f("battery_max_a", 0),
            )
            self._json(data)
            return
        if path in ("/quadro", "/quadro/"):
            self.path = "/quadro/index.html"
            return super().do_GET()
        if path in ("/", ""):
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path != "/api/quadro":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            body = {}
        data = nbr_quadro.build_board(
            load_w=float(body.get("load_w") or 350),
            battery_draw_w=float(body.get("battery_draw_w") or 400),
            battery_v=float(body.get("battery_v") or 48),
            ac_v=float(body.get("ac_v") or 220),
            panel_stc_w=float(body.get("panel_stc_w") or 2300),
            pv_v=float(body.get("pv_v") or 80),
            cable_ac_m=float(body.get("cable_ac_m") or 15),
            cable_bat_m=float(body.get("cable_bat_m") or 2),
            cable_pv_m=float(body.get("cable_pv_m") or 15),
            inverter_w=float(body.get("inverter_w") or 0),
            inverter_eff_pct=float(body.get("inverter_eff_pct") or 90),
            battery_max_a=float(body.get("battery_max_a") or 0),
            circuits_extra=body.get("circuits_extra") or [],
        )
        self._json(data)


def serve(host: str, port: int) -> None:
    threading.Thread(target=lambda: catalog.load_catalog(refresh=True), daemon=True).start()
    httpd = ThreadingHTTPServer((host, port), Handler)
    httpd.serve_forever()
