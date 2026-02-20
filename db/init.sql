-- Initiales Datenbankschema für das Event-Management-System
-- Diese Datei wird beim ersten Start von MySQL automatisch ausgeführt

CREATE DATABASE IF NOT EXISTS webapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE webapp;

CREATE TABLE IF NOT EXISTS events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    datum       DATE NOT NULL,
    beschreibung TEXT,
    erstellt_am DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teilnehmer (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT NOT NULL,
    vorname     VARCHAR(100) NOT NULL,
    nachname    VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    angemeldet_am DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_teilnehmer (event_id, email)
);
