# Event-Management-System

Eine containerisierte Webanwendung für Event-Management mit Node.js/Express-Webserver und MySQL-Datenbank,
gebaut mit Docker und Docker Compose.

**Funktionen:**
- Events erstellen (Name, Datum, Beschreibung)
- Teilnehmer für ein Event anmelden (Vorname, Nachname, E-Mail)
- Teilnehmerliste je Event anzeigen

---

## Projektstruktur

```
ImagePushen/
├── web/
│   ├── Dockerfile          # Custom Node.js Image
│   ├── server.js           # Express-Backend (REST API)
│   └── html/
│       ├── index.html      # Hauptseite (Event-Management UI)
│       ├── app.js          # Frontend-Logik (Vanilla JS)
│       └── style.css       # Stylesheet
├── db/
│   └── init.sql            # Initiales Datenbankschema (events, teilnehmer)
├── docker-compose/
│   ├── docker-compose.yml      # Orchestrierung (mit lokalem Build)
│   ├── docker-compose.hub.yml  # Orchestrierung (nur pre-built Image von Docker Hub)
│   └── .env.example            # Beispiel-Umgebungsvariablen
└── README.md
```

---

## 🚀 Start vom Docker Hub Image (empfohlen – kein Build nötig)

Das Web-Image ist fertig gebaut auf Docker Hub verfügbar (`robin223567/imagepushen-web:latest`).
Damit lässt sich das Projekt mit folgenden drei Befehlen starten:

```bash
# 1. Repository klonen (wird für init.sql der Datenbank benötigt)
git clone https://github.com/Robi2211/ImagePushen
cd ImagePushen

# 2. Fertig gebautes Image von Docker Hub holen und starten
docker-compose -f docker-compose/docker-compose.hub.yml pull
docker-compose -f docker-compose/docker-compose.hub.yml up -d
```

Die Webseite ist danach unter **http://localhost:8080** erreichbar.

> **Hinweis:** Der Befehl `pull` lädt das fertige Image direkt von Docker Hub –
> es wird **kein lokales Build durchgeführt**. Das Hochfahren dauert beim ersten Mal etwas länger,
> da MySQL die Datenbank initialisiert.

### Container stoppen

```bash
docker-compose -f docker-compose/docker-compose.hub.yml down
```

### Komplett aufräumen (inkl. Datenbankdaten)

```bash
docker-compose -f docker-compose/docker-compose.hub.yml down -v
```

---

## Schnellstart mit lokalem Build (für Entwicklung)

```bash
git clone https://github.com/Robi2211/ImagePushen
cd ImagePushen

# Passwörter setzen (optional – Standardwerte funktionieren für Tests)
cp docker-compose/.env.example docker-compose/.env
# Werte in docker-compose/.env nach Bedarf anpassen

docker-compose -f docker-compose/docker-compose.yml up -d
```

Danach ist die Webseite unter **http://localhost:8080** erreichbar.

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET`  | `/api/events` | Alle Events auflisten |
| `POST` | `/api/events` | Neues Event erstellen |
| `GET`  | `/api/events/:id/teilnehmer` | Teilnehmerliste eines Events |
| `POST` | `/api/events/:id/teilnehmer` | Teilnehmer anmelden |

---

## Wie es gebaut wurde

### 1. Webserver (Node.js + Express)

Das custom Image basiert auf dem offiziellen `node:20-alpine`-Image.
Der Express-Server stellt eine REST API bereit und liefert die statischen HTML/CSS/JS-Dateien aus.

**`web/Dockerfile`**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY html/ ./html/
EXPOSE 80
CMD ["node", "server.js"]
```

Das Image wird unter `robin223567/imagepushen-web:latest` auf Docker Hub veröffentlicht.

### 2. Datenbank (MySQL 8)

Es wird das offizielle `mysql:8`-Image verwendet.
Die Datenbank-Daten werden in einem **Docker Volume** (`db_data`) gespeichert –
dadurch bleiben die Daten beim Stoppen und Starten des Containers erhalten.

Beim ersten Start wird `db/init.sql` automatisch ausgeführt und legt die Tabellen
`events` und `teilnehmer` an.

### 3. Docker Compose

`docker-compose/docker-compose.yml` startet beide Services gemeinsam:

| Service | Image | Port | Persistenz |
|---------|-------|------|------------|
| `web`   | `robin223567/imagepushen-web:latest` (custom) | 8080→80 | – |
| `db`    | `mysql:8` | intern | Volume `db_data` |

Der Webserver startet erst, wenn die Datenbank bereit ist (`depends_on` + `healthcheck`).

---

## Image auf Docker Hub pushen

```bash
# 1. Einloggen
docker login

# 2. Image bauen
docker build -t robin223567/imagepushen-web:latest ./web

# 3. Image pushen
docker push robin223567/imagepushen-web:latest
```

---

## Zukünftige Änderungen der Webseite veröffentlichen

1. Dateien in `web/html/` oder `web/server.js` bearbeiten.
2. Image neu bauen und pushen:
   ```bash
   docker build -t robin223567/imagepushen-web:latest ./web
   docker push robin223567/imagepushen-web:latest
   ```
3. Auf dem Zielserver das neue Image holen und Container neu starten:
   ```bash
   docker-compose -f docker-compose/docker-compose.yml pull web
   docker-compose -f docker-compose/docker-compose.yml up -d --no-deps web
   ```

---

## Services stoppen und starten

```bash
# Stoppen (Daten bleiben erhalten)
docker-compose -f docker-compose/docker-compose.yml down

# Starten
docker-compose -f docker-compose/docker-compose.yml up -d

# Komplett aufräumen inkl. Volumes (Daten werden gelöscht)
docker-compose -f docker-compose/docker-compose.yml down -v
```

---

## Persistenz

Die Datenbankdaten werden im Docker Volume `db_data` gespeichert.
Auch nach einem `docker-compose down` und erneutem `up` sind alle Events und Teilnehmer noch vorhanden.
Nur `down -v` löscht das Volume und damit die Daten.

---

## Anforderungserfüllung

| Anforderung | Lösung |
|---|---|
| Webserver installieren | Node.js 20 + Express via `node:20-alpine` |
| Webseite persistent verfügbar | Custom Image + Docker Volume für DB |
| Datenbanksystem in Docker | MySQL 8 mit persistentem Volume |
| Ein Service pro Container | `web` und `db` sind getrennte Services |
| Eigenes Image erstellt | `robin223567/imagepushen-web:latest` |
| Image auf Repository gepusht | Docker Hub |
| Anleitung für Lehrperson | Dieser README (git clone + docker-compose up) |
| Event-Management-System | Events erstellen, Teilnehmer anmelden, Teilnehmerliste anzeigen |

