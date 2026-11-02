// Contact form — sends via EmailJS (public key is meant to be public; restrict it to
// maximilianstickel.de in the EmailJS dashboard under Account → Security).
const EMAILJS_PUBLIC_KEY  = 'k2jTJt4fLlSKf3Axl';
const EMAILJS_SERVICE_ID  = 'service_qz8ek5o';
const EMAILJS_TEMPLATE_ID = 'template_ely5dtl';

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

function sendEmail() {
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const status  = document.getElementById('form-status');
    const btn     = document.getElementById('send-btn');

    if (!name || !email || !message) {
        status.style.color = '#FF901F';
        status.textContent = 'Bitte alle Felder ausfüllen.';
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
        status.style.color = '#FF901F';
        status.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben.';
        return;
    }
    if (name.length > 100 || message.length > 5000) {
        status.style.color = '#FF901F';
        status.textContent = 'Die Nachricht ist zu lang.';
        return;
    }
    // Bot filled the hidden field → pretend success, send nothing
    if (document.getElementById('website').value) {
        status.style.color = '#048017';
        status.textContent = '✓ Nachricht erfolgreich gesendet!';
        return;
    }
    // One message per minute from this browser
    let last = 0;
    try { last = Number(localStorage.getItem('lastContactSent')) || 0; } catch (e) {}
    if (Date.now() - last < 60000) {
        status.style.color = '#FF901F';
        status.textContent = 'Bitte warte kurz, bevor du noch eine Nachricht schickst.';
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'Wird gesendet…';
    status.textContent = '';

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name:  name,
        from_email: email,
        message:    message,
        to_email:   'red7creeeper@gmail.com'
    }).then(() => {
        try { localStorage.setItem('lastContactSent', String(Date.now())); } catch (e) {}
        status.style.color = '#048017';
        status.textContent = '✓ Nachricht erfolgreich gesendet!';
        btn.textContent    = 'Nachricht senden';
        btn.disabled       = false;
        document.getElementById('name').value    = '';
        document.getElementById('email').value   = '';
        document.getElementById('message').value = '';
    }).catch((err) => {
        console.error('EmailJS Fehler:', err);
        status.style.color = '#cc0000';
        status.textContent = 'Fehler beim Senden. Bitte versuche es später nochmal.';
        btn.textContent    = 'Nachricht senden';
        btn.disabled       = false;
    });
}

document.getElementById('send-btn').addEventListener('click', sendEmail);
