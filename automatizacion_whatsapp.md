# Automatización de WhatsApp — Envío masivo de recordatorios

## Idea general
Script Python que consume la lista de alumnos vencidos del backend de FitFlow
y les envía un mensaje personalizado por WhatsApp Web de forma automática.

---

## Stack necesario
- Python 3.10+
- `playwright` (controlar el navegador)
- `requests` (consumir la API de FitFlow)

```bash
pip install playwright requests
playwright install chromium
```

---

## Pasos

### 1. Obtener el token de FitFlow
Hacer login contra el backend para obtener el JWT:

```python
import requests

res = requests.post("http://localhost:3001/api/auth/login", json={
    "email": "tu@email.com",
    "password": "tupassword"
})
token = res.cookies.get("token")
gym_id = res.cookies.get("gym_id")
```

---

### 2. Traer la lista de vencidos
Usar el endpoint que ya existe en FitFlow:

```python
res = requests.get(
    "http://localhost:3001/api/alumnos/expired",
    headers={"Authorization": f"Bearer {token}"}
)
vencidos = res.json()["items"]
# cada item tiene: nombre, telefono, plan_nombre, plan_precio, fecha_de_vencimiento
```

---

### 3. Iniciar WhatsApp Web y escanear QR (solo la primera vez)
La sesión se guarda en una carpeta local, no hay que re-escanear cada vez.

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(
        user_data_dir="./wa_session",
        headless=False
    )
    page = browser.new_page()
    page.goto("https://web.whatsapp.com")
    input("Escaneá el QR con el celular y presioná Enter para continuar...")
```

---

### 4. Armar el mensaje personalizado
Mismo formato que usa FitFlow en el botón WA de la app:

```python
import urllib.parse
from datetime import datetime

GYM_NAME = "Nombre del Gym"

def armar_mensaje(alumno: dict) -> str:
    fv = alumno.get("fecha_de_vencimiento", "")
    try:
        fecha = datetime.strptime(fv, "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        fecha = fv

    plan = alumno.get("plan_nombre") or "tu plan"
    precio = f"${alumno['plan_precio']}" if alumno.get("plan_precio") else "consultar precio"

    return (
        f"¡Hola {alumno['nombre']}! ¿Cómo estás?\n\n"
        f"Te escribimos desde *{GYM_NAME}* con un recordatorio rápido\n\n"
        f"Tu membresía venció el {fecha} y te extrañamos por acá!\n\n"
        f"*Tu plan*:\n{plan}\nPrecio: {precio}\n\n"
        f"¡Renovar es muy fácil, avisanos y te ayudamos!\n"
        f"Te esperamos con las puertas abiertas"
    )
```

---

### 5. Enviar los mensajes en loop
```python
import time

DELAY_ENTRE_MENSAJES = 4  # segundos — no bajar de 3 para evitar ban

for alumno in vencidos:
    telefono = (alumno.get("telefono") or "").replace(" ", "").replace("-", "").replace("+", "")
    if not telefono:
        print(f"  Sin telefono: {alumno['nombre']}, saltando...")
        continue

    mensaje = armar_mensaje(alumno)
    url = f"https://web.whatsapp.com/send?phone={telefono}&text={urllib.parse.quote(mensaje)}"

    page.goto(url)

    try:
        page.wait_for_selector('div[aria-label="Escribe un mensaje"]', timeout=15000)
        page.keyboard.press("Enter")
        print(f"  Enviado a {alumno['nombre']} ({telefono})")
    except Exception as e:
        print(f"  Error con {alumno['nombre']}: {e}")

    time.sleep(DELAY_ENTRE_MENSAJES)
```

---

### 6. Script completo armado
Uniendo todo en un solo archivo `enviar_recordatorios.py`:

```python
import requests
import urllib.parse
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

# --- CONFIG ---
BACKEND_URL = "http://localhost:3001"
EMAIL       = "tu@email.com"
PASSWORD    = "tupassword"
GYM_NAME    = "Nombre del Gym"
DELAY       = 4  # segundos entre mensajes
# --------------

def login():
    res = requests.post(f"{BACKEND_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
    return res.cookies.get("token"), res.cookies.get("gym_id")

def get_vencidos(token):
    res = requests.get(
        f"{BACKEND_URL}/api/alumnos/expired",
        headers={"Authorization": f"Bearer {token}"}
    )
    return res.json()["items"]

def armar_mensaje(alumno):
    fv = alumno.get("fecha_de_vencimiento", "")
    try:
        fecha = datetime.strptime(fv, "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        fecha = fv
    plan   = alumno.get("plan_nombre") or "tu plan"
    precio = f"${alumno['plan_precio']}" if alumno.get("plan_precio") else "consultar precio"
    return (
        f"¡Hola {alumno['nombre']}! ¿Cómo estás?\n\n"
        f"Te escribimos desde *{GYM_NAME}* con un recordatorio rápido\n\n"
        f"Tu membresía venció el {fecha} y te extrañamos por acá!\n\n"
        f"*Tu plan*:\n{plan}\nPrecio: {precio}\n\n"
        f"¡Renovar es muy fácil, avisanos y te ayudamos!\n"
        f"Te esperamos con las puertas abiertas"
    )

def main():
    print("Haciendo login...")
    token, gym_id = login()

    print("Obteniendo vencidos...")
    vencidos = get_vencidos(token)
    con_telefono = [a for a in vencidos if a.get("telefono")]
    print(f"Total vencidos: {len(vencidos)} | Con teléfono: {len(con_telefono)}")

    if not con_telefono:
        print("No hay nadie para notificar.")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir="./wa_session",
            headless=False
        )
        page = browser.new_page()
        page.goto("https://web.whatsapp.com")
        input("\nEscaneá el QR si es la primera vez, luego presioná Enter...")

        for i, alumno in enumerate(con_telefono, 1):
            telefono = alumno["telefono"].replace(" ", "").replace("-", "").replace("+", "")
            mensaje  = armar_mensaje(alumno)
            url      = f"https://web.whatsapp.com/send?phone={telefono}&text={urllib.parse.quote(mensaje)}"

            print(f"[{i}/{len(con_telefono)}] Enviando a {alumno['nombre']}...")
            page.goto(url)

            try:
                page.wait_for_selector('div[aria-label="Escribe un mensaje"]', timeout=15000)
                page.keyboard.press("Enter")
            except Exception as e:
                print(f"  ERROR: {e}")

            time.sleep(DELAY)

        print("\nListo. Todos los mensajes enviados.")
        browser.close()

if __name__ == "__main__":
    main()
```

---

## Consideraciones importantes

| Tema | Detalle |
|---|---|
| **Ban** | WhatsApp puede banear el número si detecta automatización agresiva. Mantener el delay en 3-5 segundos mínimo. |
| **Sesión** | La carpeta `./wa_session` guarda la sesión. Solo hay que escanear QR la primera vez. |
| **Teléfonos** | Deben incluir código de país (ej: `5491112345678` para Argentina). Verificar que los datos del gym tengan el formato correcto. |
| **Volumen** | Funciona bien para decenas de mensajes por corrida. Para cientos, agregar más delay o dividir en días. |
| **Horario** | Evitar enviar de noche. Mejor entre 9hs y 20hs. |
