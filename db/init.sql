-- Initiales Datenbankschema für die Webanwendung
-- Diese Datei wird beim ersten Start von MySQL automatisch ausgeführt

CREATE DATABASE IF NOT EXISTS webapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE webapp;

CREATE TABLE IF NOT EXISTS besuche (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    zeitstempel DATETIME DEFAULT CURRENT_TIMESTAMP
);
