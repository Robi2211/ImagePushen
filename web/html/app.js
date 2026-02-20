'use strict';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showMsg(el, text, type) {
    el.innerHTML = `<div class="msg ${type}">${escapeHtml(text)}</div>`;
}

/* ── Events laden & Dropdowns befüllen ───────────────────────────────────── */

async function loadEvents() {
    try {
        const res  = await fetch('/api/events');
        const data = await res.json();
        if (!data.success) return;

        const selAnmelden = document.getElementById('select-event-anmelden');
        const selListe    = document.getElementById('select-event-liste');

        // Remember current selection
        const prevAnmelden = selAnmelden.value;
        const prevListe    = selListe.value;

        // Clear and repopulate (keep placeholder)
        [selAnmelden, selListe].forEach(sel => {
            while (sel.options.length > 1) sel.remove(1);
        });

        data.events.forEach(ev => {
            [selAnmelden, selListe].forEach(sel => {
                const opt = document.createElement('option');
                opt.value       = ev.id;
                opt.textContent = `${ev.name} (${new Date(ev.datum).toLocaleDateString('de-CH')})`;
                sel.appendChild(opt);
            });
        });

        // Restore selection if still present
        if (prevAnmelden) selAnmelden.value = prevAnmelden;
        if (prevListe)    selListe.value    = prevListe;
    } catch (err) {
        console.error('Fehler beim Laden der Events:', err);
    }
}

/* ── Event erstellen ─────────────────────────────────────────────────────── */

document.getElementById('form-event').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('event-msg');
    msgEl.innerHTML = '';

    const name         = document.getElementById('event-name').value.trim();
    const datum        = document.getElementById('event-datum').value;
    const beschreibung = document.getElementById('event-beschreibung').value.trim();

    try {
        const res  = await fetch('/api/events', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name, datum, beschreibung }),
        });
        const data = await res.json();
        if (data.success) {
            showMsg(msgEl, `✔ Event "${name}" wurde erfolgreich erstellt!`, 'success');
            e.target.reset();
            await loadEvents();
        } else {
            showMsg(msgEl, data.error || 'Unbekannter Fehler.', 'error');
        }
    } catch (err) {
        showMsg(msgEl, `Fehler: ${err.message}`, 'error');
    }
});

/* ── Teilnehmer anmelden ─────────────────────────────────────────────────── */

document.getElementById('form-teilnehmer').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl  = document.getElementById('teilnehmer-msg');
    msgEl.innerHTML = '';

    const eventId = document.getElementById('select-event-anmelden').value;
    if (!eventId) {
        showMsg(msgEl, 'Bitte zuerst ein Event auswählen.', 'error');
        return;
    }

    const vorname  = document.getElementById('t-vorname').value.trim();
    const nachname = document.getElementById('t-nachname').value.trim();
    const email    = document.getElementById('t-email').value.trim();

    try {
        const res  = await fetch(`/api/events/${eventId}/teilnehmer`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ vorname, nachname, email }),
        });
        const data = await res.json();
        if (data.success) {
            showMsg(msgEl, `✔ ${vorname} ${nachname} wurde erfolgreich angemeldet!`, 'success');
            e.target.reset();
            // Refresh list if the same event is currently shown
            const selListe = document.getElementById('select-event-liste');
            if (selListe.value === eventId) {
                await loadTeilnehmer(eventId);
            }
        } else {
            showMsg(msgEl, data.error || 'Unbekannter Fehler.', 'error');
        }
    } catch (err) {
        showMsg(msgEl, `Fehler: ${err.message}`, 'error');
    }
});

/* ── Teilnehmerliste anzeigen ────────────────────────────────────────────── */

async function loadTeilnehmer(eventId) {
    const container = document.getElementById('teilnehmerliste');
    if (!eventId) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = '<p class="empty-msg">Lade Teilnehmerliste…</p>';
    try {
        const res  = await fetch(`/api/events/${eventId}/teilnehmer`);
        const data = await res.json();
        if (!data.success) {
            container.innerHTML = `<p class="empty-msg">${escapeHtml(data.error)}</p>`;
            return;
        }
        if (data.teilnehmer.length === 0) {
            container.innerHTML = '<p class="empty-msg">Noch keine Teilnehmer für dieses Event.</p>';
            return;
        }
        let html = `<p><strong>${data.teilnehmer.length}</strong> Teilnehmer angemeldet</p>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>Vorname</th><th>Nachname</th><th>E-Mail</th><th>Angemeldet am</th></tr>
            </thead>
            <tbody>`;
        data.teilnehmer.forEach((t, i) => {
            const datum = new Date(t.angemeldet_am).toLocaleString('de-CH');
            html += `<tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(t.vorname)}</td>
              <td>${escapeHtml(t.nachname)}</td>
              <td>${escapeHtml(t.email)}</td>
              <td>${escapeHtml(datum)}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p class="empty-msg">Fehler: ${escapeHtml(err.message)}</p>`;
    }
}

document.getElementById('select-event-liste').addEventListener('change', (e) => {
    loadTeilnehmer(e.target.value);
});

/* ── Initialisierung ─────────────────────────────────────────────────────── */

loadEvents();

