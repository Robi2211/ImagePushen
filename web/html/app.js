(async () => {
    const container = document.getElementById('db-status');

    try {
        const response = await fetch('/api/visits');
        const data     = await response.json();

        if (!response.ok || !data.success) {
            container.innerHTML =
                `<p class="status error">&#10008; Datenbankverbindung fehlgeschlagen: ${escapeHtml(data.error || 'Unbekannter Fehler')}</p>`;
            return;
        }

        let html = `<p class="status success">&#10004; Erfolgreich mit der Datenbank verbunden!</p>`;
        html    += `<p>Diese Seite wurde <strong>${data.count}</strong> Mal besucht.</p>`;
        html    += `<h3>Letzte Besuche:</h3><ul>`;
        data.visits.forEach(ts => {
            const formatted = new Date(ts).toLocaleString('de-CH');
            html += `<li>${escapeHtml(formatted)}</li>`;
        });
        html += `</ul>`;

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML =
            `<p class="status error">&#10008; Fehler beim Laden der Daten: ${escapeHtml(err.message)}</p>`;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }
})();
