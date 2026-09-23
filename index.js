import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== 401
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('BOT CONECTADO ✅')
        }
    })
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message || msg.key.fromMe) return
        const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
        const from = msg.key.remoteJid
        if(texto === 'hola') {
            await sock.sendMessage(from, { text: '¡Hola! 👋 Soy tu bot 24/7' })
        }
        if(texto === 'ping') {
            await sock.sendMessage(from, { text: 'pong 🏓' })
        }
    })
}
startBot()
