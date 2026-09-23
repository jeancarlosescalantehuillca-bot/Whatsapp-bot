import pkg from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

const makeWASocket = pkg.default;
const { useMultiFileAuthState, DisconnectReason } = pkg;

const PHONE_NUMBER = '51916017747';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Ubuntu', 'Chrome', '22.04']
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log('========================================');
                console.log(`CODIGO PARA ${PHONE_NUMBER}: ${code}`);
                console.log('========================================');
                console.log('Ve a WhatsApp > 3 puntitos > Dispositivos vinculados > Vincular con numero de telefono');
            } catch (e) {
                console.log('Error pidiendo codigo:', e.message);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ BOT CONECTADO!');
        }
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
        if (text.toLowerCase() === 'hola') {
            await sock.sendMessage(from, { text: '¡Hola! Bot activo ✅ Escribe menu' });
        }
        if (text.toLowerCase() === 'menu') {
            await sock.sendMessage(from, { text: '📋 MENU:\n1. hola\n2. menu\n3. ping' });
        }
        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(from, { text: 'pong! 🏓' });
        }
    });
}
startBot();
