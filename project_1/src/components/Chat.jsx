import React, { useState, useEffect, useRef } from "react";
import { XMPPClient } from "../services/XMPPClient";

const Chat = () => {
  const [jid, setJid] = useState("");
  const [password, setPassword] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  // Usar useRef para persistir la instancia de XMPPClient entre renders
  const clientRef = useRef(new XMPPClient());

  const handleConnect = () => {
    const client = clientRef.current; // Obtener la referencia a la instancia de XMPPClient
    client.connect(jid, password, onMessage, () => setConnected(true));
  };

  const onMessage = (msg) => {
    const from = msg.getAttribute("from");
    const body = msg.getElementsByTagName("body")[0];
    if (body) {
      setMessages((prev) => [...prev, { from, body: body.textContent }]);
    }
    return true;
  };

  const handleSendMessage = () => {
    const client = clientRef.current; // Obtener la referencia a la instancia de XMPPClient
    client.sendMessage(to, message);
    setMessages((prev) => [...prev, { from: "Me", body: message }]);
    setMessage("");
  };

  return (
    <div>
      {!connected ? (
        <div>
          <h2>Conectar a XMPP</h2>
          <input
            type="text"
            placeholder="JID"
            value={jid}
            onChange={(e) => setJid(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleConnect}>Conectar</button>
        </div>
      ) : (
        <div>
          <h2>Chat</h2>
          <input
            type="text"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Enviar</button>
          <div>
            <h3>Mensajes:</h3>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}>
                  <strong>{msg.from}:</strong> {msg.body}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;