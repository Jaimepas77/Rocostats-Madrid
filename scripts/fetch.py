import requests, json, datetime, subprocess
from urllib.parse import unquote
from zoneinfo import ZoneInfo
from pathlib import Path

BASE = "https://sputnikclimbing.deporsite.net"
DATA_FILE = Path(__file__).parent.parent / "data" / "stats.json"
SECRETS_FILE = Path(__file__).parent / ".secrets"

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

    push_changes()


def push_changes():
    try:
        if not SECRETS_FILE.exists():
            print("Warning: .secrets file not found. Skipping push.")
            return

        secrets = json.loads(SECRETS_FILE.read_text())
        token = secrets.get("GITHUB_TOKEN")
        
        if not token:
            print("Warning: GITHUB_TOKEN not found in .secrets. Skipping push.")
            return

        repo_root = DATA_FILE.parent.parent
        
        subprocess.run(["git", "add", str(DATA_FILE)], cwd=repo_root, check=True)
        
        # Check if there are changes to commit
        status = subprocess.run(["git", "status", "--porcelain", str(DATA_FILE)], cwd=repo_root, capture_output=True, text=True).stdout
        if not status:
            print("No changes to commit.")
            return

        message = f"Update stats: {datetime.datetime.now().replace(microsecond=0).isoformat()}"
        subprocess.run(["git", "commit", "-m", message], cwd=repo_root, check=True)

        remote_url = subprocess.check_output(["git", "remote", "get-url", "origin"], cwd=repo_root, text=True).strip()
        
        if remote_url.startswith("https://"):
            auth_url = remote_url.replace("https://", f"https://{token}@", 1)
            subprocess.run(["git", "push", auth_url], cwd=repo_root, check=True)
        else:
            print("Remote URL must be HTTPS to use the token.")

    except Exception as e:
        print(f"Error during git operation: {e}")



if __name__ == "__main__":
    main()
