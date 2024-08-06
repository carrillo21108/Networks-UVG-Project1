process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const { client, xml } = require('@xmpp/client');
const debug = require('@xmpp/debug');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(morgan('dev'));

// XMPP Client configuration
const xmpp = client({
    service: 'ws://alumchat.lol:7070/ws/', // URL del servidor XMPP
    domain: 'alumchat.lol', // Dominio del servidor XMPP
    username: 'car_21108', // Tu nombre de usuario
    password: 'prueba2024'  // Tu contraseña
});

// const xmpp = client({
//     service: 'wss://tigase.im:5291/xmpp-websocket', // URL del servidor XMPP
//     domain: 'tigase.im', // Dominio del servidor XMPP
//     username: 'bcarrillo', // Tu nombre de usuario
//     password: 'prueba2024'  // Tu contraseña
// });

debug(xmpp, true); // Opcional: Para depuración

xmpp.on('error', err => {
    console.error('❌ Error:', err);
});

xmpp.on('offline', () => {
    console.log('🔴 Offline');
});

xmpp.on('online', async(address) => {
    // Makes itself available
    await xmpp.send(xml("presence"));

    // Sends a chat message to itself
    const message = xml(
        "message",
        { type: "chat", to: address },
        xml("body", {}, "PRUEBAAAAA"),
    );
    await xmpp.send(message);

//   console.log('🟢 Online as', address.toString());
});

xmpp.on('stanza', async(stanza) => {
    if (stanza.is('message')) {
        console.log('📩 New message stanza:', stanza.toString());
        // await xmpp.send(xml("presence", { type: "unavailable" }));
        // await xmpp.stop();
    } else if (stanza.is('presence')) {
        console.log('🌐 New presence stanza:', stanza.toString());
    } else if (stanza.is('iq')) {
        console.log('🔍 New IQ stanza:', stanza.toString());
    }
  });

xmpp.start().catch(console.error);

// Express routes
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
