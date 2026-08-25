from __future__ import annotations

import argparse
import os
import socket
import subprocess
import webbrowser

from autonomia.server import serve

PORT = 8791


def _in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def _open(url: str) -> None:
    chrome = "/usr/bin/google-chrome-stable"
    if os.path.isfile(chrome):
        subprocess.Popen(
            [chrome, "--profile-directory=Default", "--class=AutonomiaSolar",
             "--name=Autonomia Solar", f"--app={url}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        return
    webbrowser.open(url)


def _is_cloud() -> bool:
    return bool(os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("RAILWAY_PROJECT_ID"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Calculadora de autonomia de banco de baterias")
    cloud = _is_cloud()
    env_port = os.environ.get("PORT")
    parser.add_argument("--host", default="0.0.0.0" if cloud or env_port else "127.0.0.1")
    parser.add_argument("--port", type=int, default=int(env_port or PORT))
    parser.add_argument("--no-browser", action="store_true", default=cloud)
    args = parser.parse_args()
    url = f"http://127.0.0.1:{args.port}/"
    if not cloud and _in_use(args.port):
        if not args.no_browser:
            _open(url)
        return
    if not args.no_browser:
        _open(url)
    serve(args.host, args.port)


if __name__ == "__main__":
    main()
