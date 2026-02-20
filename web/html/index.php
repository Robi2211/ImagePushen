<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ImagePushen - Webseite</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Willkommen bei ImagePushen</h1>
        <p>Eine einfache Webseite mit PHP, Apache und MariaDB in Docker</p>
    </header>

    <main>
        <section class="card">
            <h2>Datenbankverbindung</h2>
            <?php
            $host     = getenv('DB_HOST') ?: 'db';
            $dbname   = getenv('DB_NAME') ?: 'webapp';
            $user     = getenv('DB_USER') ?: 'webuser';
            $password = getenv('DB_PASSWORD') ?: '';

            $conn = new mysqli($host, $user, $password, $dbname);

            if ($conn->connect_error) {
                echo '<p class="status error">&#10008; Datenbankverbindung fehlgeschlagen: '
                    . htmlspecialchars($conn->connect_error) . '</p>';
            } else {
                echo '<p class="status success">&#10004; Erfolgreich mit der Datenbank verbunden!</p>';

                // Create table if it doesn't exist
                $created = $conn->query(
                    "CREATE TABLE IF NOT EXISTS besuche (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        zeitstempel DATETIME DEFAULT CURRENT_TIMESTAMP
                    )"
                );

                if ($created === false) {
                    echo '<p class="status error">&#10008; Fehler beim Erstellen der Tabelle: '
                        . htmlspecialchars($conn->error) . '</p>';
                } else {
                    // Record this visit
                    $inserted = $conn->query("INSERT INTO besuche (zeitstempel) VALUES (NOW())");
                    if ($inserted === false) {
                        echo '<p class="status error">&#10008; Fehler beim Speichern des Besuchs: '
                            . htmlspecialchars($conn->error) . '</p>';
                    }

                    // Fetch visit count
                    $result = $conn->query("SELECT COUNT(*) AS anzahl FROM besuche");
                    $row    = $result->fetch_assoc();
                    echo '<p>Diese Seite wurde <strong>' . (int)$row['anzahl'] . '</strong> Mal besucht.</p>';

                    // Show last 5 visits
                    $visits = $conn->query("SELECT zeitstempel FROM besuche ORDER BY id DESC LIMIT 5");
                    echo '<h3>Letzte Besuche:</h3><ul>';
                    while ($v = $visits->fetch_assoc()) {
                        echo '<li>' . htmlspecialchars($v['zeitstempel']) . '</li>';
                    }
                    echo '</ul>';
                }

                $conn->close();
            }
            ?>
        </section>

        <section class="card">
            <h2>Über dieses Projekt</h2>
            <ul>
                <li><strong>Webserver:</strong> Apache 2 mit PHP 8.2</li>
                <li><strong>Datenbank:</strong> MariaDB 10</li>
                <li><strong>Orchestrierung:</strong> Docker Compose</li>
                <li><strong>Persistenz:</strong> Docker Volumes</li>
            </ul>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 ImagePushen &mdash; Modul 347</p>
    </footer>
</body>
</html>
