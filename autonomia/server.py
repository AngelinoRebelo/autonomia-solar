from __future__ import annotations

import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from autonomia import calc, catalog

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
            )
            self._json(result)
            return
        if path in ("/", ""):
            self.path = "/index.html"
        return super().do_GET()


def serve(host: str, port: int) -> None:
    threading.Thread(target=lambda: catalog.load_catalog(refresh=True), daemon=True).start()
    httpd = ThreadingHTTPServer((host, port), Handler)
    httpd.serve_forever()
