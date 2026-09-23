import pkg from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
const makeWASocket = pkg.default;
const { useMultiFileAuthState, DisconnectReason } = pkg;
const PHONE_NUMBER = '51916017747';
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot WhatsApp Activo'));
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }), browser: ['Ubuntu','Chrome','22.04'] });
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log('========================================');
                console.log(`CODIGO PARA ${PHONE_NUMBER}: ${code}`);
                console.log('========================================');
            } catch (e) { console.log('Error:', e.message); }
        }, 5000);
    }
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log('✅ BOT CONECTADO!');
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const from = m.key.remoteJid;
        if (text.toLowerCase() === 'hola') await sock.sendMessage(from, { text: 'Hola! Bot activo ✅' });
        if (text.toLowerCase() === 'menu') await sock.sendMessage(from, { text: 'MENU: hola, menu, ping' });
        if (text.toLowerCase() === 'ping') await sock.sendMessage(from, { text: 'pong! 🏓' });
    });
}
startBot();
