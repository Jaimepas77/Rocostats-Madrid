import requests, json, datetime
from urllib.parse import unquote
from zoneinfo import ZoneInfo
from pathlib import Path

BASE = "https://sputnikclimbing.deporsite.net"
DATA_FILE = Path("data/stats.json")

def get_data():
    s = requests.Session()
    s.get(f"{BASE}/aforo-lasrozas")

    token = unquote(s.cookies.get("XSRF-TOKEN"))

    headers = {
        "x-xsrf-token": token,
        "x-requested-with": "XMLHttpRequest",
        "referer": f"{BASE}/aforo-lasrozas",
    }

    r = s.post(
        f"{BASE}/ajax/TInnova_v2/Listado_OcupacionAforo/llamadaAjax/obtenerOcupacion",
        headers=headers,
    )

    return r.json()


def main():
    now = datetime.datetime.now(ZoneInfo("Europe/Madrid")).isoformat()

    entry = {
        "timestamp": now,
        "data": get_data()
    }

    DATA_FILE.parent.mkdir(exist_ok=True)

    if DATA_FILE.exists():
        history = json.loads(DATA_FILE.read_text())
    else:
        history = []

    history.append(entry)

    DATA_FILE.write_text(json.dumps(history, indent=2))


if __name__ == "__main__":
    main()
