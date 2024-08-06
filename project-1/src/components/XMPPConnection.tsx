// src/components/XMPPConnection.tsx

import React, { useState, useEffect } from 'react';
import client, { Client } from '@xmpp/client';
import xml from '@xmpp/xml';

interface Message {
  text: string;
  from: string;
}

const XMPPConnection: React.FC = () => {
  const [status, setStatus] = useState<string>('Disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const xmpp = new client({
      service: 'wss://alumchat.lol/xmpp-websocket', // Asegúrate de que el servidor soporta WebSocket
      domain: 'alumchat.lol',
      resource: 'example',
      username: 'your-username', // Reemplaza con tu nombre de usuario
      password: 'your-password', // Reemplaza con tu contraseña
    });

    xmpp.on('error', (err: Error) => {
      console.error('❌', err.toString());
      setStatus('Error');
    });

    xmpp.on('status', (status: string) => {
      console.log('Status:', status);
      setStatus(status);
    });

    xmpp.on('online', (address: any) => {
      console.log('🗸', 'online as', address.toString());
      setStatus('Online');
    });

    xmpp.on('stanza', async (stanza: any) => {
      if (stanza.is('message')) {
        const body = stanza.getChild('body');
        if (body) {
          setMessages((prevMessages) => [...prevMessages, { text: body.text(), from: stanza.attrs.from }]);
        }
      }
    });

    xmpp.start().catch(console.error);

    return () => {
      xmpp.stop().catch(console.error);
    };
  }, []);

  const handleSendMessage = async () => {
    const xmpp: Client = client({
      service: 'wss://alumchat.lol/xmpp-websocket',
      domain: 'alumchat.lol',
      resource: 'example',
      username: 'your-username',
      password: 'your-password',
    });

    const messageStanza = xml(
      'message',
      { type: 'chat', to: 'recipient@alumchat.lol' },
      xml('body', {}, message)
    );

    await xmpp.send(messageStanza);
    setMessage('');
  };

  return (
    <div>
      <h1>XMPP Connection Status: {status}</h1>
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.from}:</strong> {msg.text}
            </li>
          ))}
        </ul>
      </div>
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
};

export default XMPPConnection;
