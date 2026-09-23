import pkg from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
const makeWASocket = pkg.default;
const { useMultiFileAuthState, DisconnectReason } = pkg;

const PHONE_NUMBER = '51916017747';
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Bot Activo! Revisa los Logs para tu codigo'));

app.listen(PORT, () => console.log(`Server on ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(PHONE_NUMBER);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n\n TU CODIGO DE VINCULACION ES: ${code} \n\n`);
            } catch (e) {
                console.log('Error al pedir codigo:', e.message);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ BOT CONECTADO!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (text.toLowerCase() === 'hola') {
            await sock.sendMessage(msg.key.remoteJid, { text: '¡Hola! Soy tu bot 🤖' });
        }
    });
}

startBot();
