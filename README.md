# ImagePushen

Eine containerisierte Webanwendung mit Apache/PHP-Webserver und MySQL-Datenbank,
gebaut mit Docker und Docker Compose.

---

## Projektstruktur

```
ImagePushen/
├── web/
│   ├── Dockerfile          # Custom PHP/Apache Image
│   └── html/
│       ├── index.php       # Hauptseite (zeigt DB-Verbindung & Besuchszähler)
│       └── style.css       # Stylesheet
├── db/
│   └── init.sql            # Initiales Datenbankschema
├── docker-compose/
│   ├── docker-compose.yml  # Orchestrierung beider Services
│   └── .env.example        # Vorlage für Umgebungsvariablen
├── Makefile                # Kurzbefehl-Sammlung (make start, make stop, …)
└── README.md
```

---

## Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (enthält Docker Engine + Compose)  
  Oder: Docker Engine + Docker Compose Plugin auf Linux

---

## Schnellstart (für Lehrperson / Play with Docker)

### Option A – mit `make` (empfohlen)

```bash
git clone https://github.com/Robi2211/ImagePushen
cd ImagePushen
make start
```

`make start` kopiert automatisch die `.env.example` nach `.env` (falls noch nicht vorhanden)
und startet alle Services inklusive Build.

| Befehl | Aktion |
|--------|--------|
| `make start` | Services starten (baut Image automatisch) |
| `make stop` | Services stoppen (Daten bleiben erhalten) |
| `make logs` | Live-Logs aller Services anzeigen |
| `make build` | Image neu bauen |
| `make clean` | Services stoppen **und** Volumes löschen |

### Option B – manuell mit Docker Compose

```bash
git clone https://github.com/Robi2211/ImagePushen
cd ImagePushen

# Passwörter setzen (optional – Standardwerte funktionieren für Tests)
cp docker-compose/.env.example docker-compose/.env

# Neuere Docker-Versionen (Plugin):
docker compose -f docker-compose/docker-compose.yml up -d --build

# Ältere Installationen (standalone):
docker-compose -f docker-compose/docker-compose.yml up -d --build
```

Danach ist die Webseite unter **http://localhost:8080** erreichbar.

---

## Wie es gebaut wurde

### 1. Webserver (Apache + PHP)

Das custom Image basiert auf dem offiziellen `php:8.2-apache`-Image.
Die `mysqli`-Erweiterung wird nachinstalliert, damit PHP mit MariaDB kommunizieren kann.
Die Webseite-Dateien (`index.php`, `style.css`) werden ins Document-Root kopiert.

**`web/Dockerfile`**
```dockerfile
FROM php:8.2-apache
RUN docker-php-ext-install mysqli
COPY html/ /var/www/html/
EXPOSE 80
```

Das Image wird unter `robi2211/imagepushen-web:latest` auf Docker Hub veröffentlicht.

### 2. Datenbank (MySQL)

Es wird das offizielle `mysql:8`-Image verwendet.
Die Datenbank-Daten werden in einem **Docker Volume** (`db_data`) gespeichert –
dadurch bleiben die Daten beim Stoppen und Starten des Containers erhalten.

Beim ersten Start wird `db/init.sql` automatisch ausgeführt und legt die Datenbank
sowie die Tabellen an.

### 3. Docker Compose

`docker-compose/docker-compose.yml` startet beide Services gemeinsam:

| Service | Image | Port | Persistenz |
|---------|-------|------|------------|
| `web`   | `robi2211/imagepushen-web:latest` (custom) | 8080→80 | – |
| `db`    | `mysql:8` | intern | Volume `db_data` |

Der Webserver startet erst, wenn die Datenbank bereit ist (`depends_on` + `healthcheck`).

---

## Image auf Docker Hub pushen

```bash
# 1. Einloggen
docker login

# 2. Image bauen
docker build -t robi2211/imagepushen-web:latest ./web

# 3. Image pushen
docker push robi2211/imagepushen-web:latest
```

---

## Zukünftige Änderungen der Webseite veröffentlichen

1. Dateien in `web/html/` bearbeiten (z. B. `index.php`).
2. Image neu bauen und pushen:
   ```bash
   docker build -t robi2211/imagepushen-web:latest ./web
   docker push robi2211/imagepushen-web:latest
   ```
3. Auf dem Zielserver das neue Image holen und Container neu starten:
   ```bash
   docker compose -f docker-compose/docker-compose.yml pull web
   docker compose -f docker-compose/docker-compose.yml up -d --no-deps web
   ```

---

## Services stoppen und starten

```bash
# Stoppen (Daten bleiben erhalten)
make stop
# oder: docker compose -f docker-compose/docker-compose.yml down

# Starten
make start
# oder: docker compose -f docker-compose/docker-compose.yml up -d --build

# Komplett aufräumen inkl. Volumes (Daten werden gelöscht)
make clean
# oder: docker compose -f docker-compose/docker-compose.yml down -v
```

---

## Persistenz

Die Datenbankdaten werden im Docker Volume `db_data` gespeichert.
Auch nach einem `docker-compose down` und erneutem `up` sind alle Daten noch vorhanden.
Nur `down -v` löscht das Volume und damit die Daten.

---

## Fehlerbehebung

### `Permission denied (publickey)` beim Klonen

```
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

**Ursache:** Du versuchst das Repository über SSH zu klonen, aber auf deinem Rechner ist kein SSH-Schlüssel für GitHub hinterlegt.

**Lösung – HTTPS statt SSH verwenden (empfohlen):**

```bash
git clone https://github.com/Robi2211/ImagePushen
```

Stelle sicher, dass du die URL mit `https://` beginnst und **nicht** `git@github.com:`.  
GitHub fordert dann bei Bedarf deinen GitHub-Benutzernamen und ein [Personal Access Token](https://github.com/settings/tokens) als Passwort.

**Alternative – SSH-Schlüssel einrichten (für Entwickler):**

1. Schlüsselpaar generieren: `ssh-keygen -t ed25519 -C "deine@email.com"`
2. Öffentlichen Schlüssel (`~/.ssh/id_ed25519.pub`) in GitHub unter  
   **Settings → SSH and GPG keys → New SSH key** eintragen.
3. Danach funktioniert auch `git clone git@github.com:Robi2211/ImagePushen`.

---

## Anforderungserfüllung

| Anforderung | Lösung |
|---|---|
| Webserver installieren | Apache 2 via `php:8.2-apache` |
| Webseite persistent verfügbar | Custom Image + Docker Volume für DB |
| Datenbanksystem in Docker | MySQL 8 mit persistentem Volume |
| Ein Service pro Container | `web` und `db` sind getrennte Services |
| Eigenes Image erstellt | `robi2211/imagepushen-web:latest` |
| Image auf Repository gepusht | Docker Hub |
| Anleitung für Lehrperson | Dieser README (git clone + docker-compose up) |
