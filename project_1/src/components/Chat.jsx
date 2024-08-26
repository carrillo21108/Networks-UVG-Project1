import React, { useState, useEffect, useRef } from "react";
import { XMPPClient } from "../services/XMPPClient";

const Chat = () => {
  // State hooks to manage input fields and chat state
  const [jid, setJid] = useState("");
  const [password, setPassword] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // Array to store chat messages
  const [connected, setConnected] = useState(false); // Connection status

  // useRef to persist the XMPPClient instance between renders
  const clientRef = useRef(new XMPPClient()); // Create a new XMPPClient instance

  // Handle user connection to the XMPP server
  const handleConnect = () => {
    const client = clientRef.current; // Obtain the reference to the XMPPClient instance
    client.connect(jid, password, onMessage, () => setConnected(true)); // Connect using JID and password, and set connection status to true
  };

  // Callback function to handle incoming messages
  const onMessage = (msg) => {
    const from = msg.getAttribute("from"); // Extract the sender's JID from the message
    const body = msg.getElementsByTagName("body")[0]; // Extract the message body
    if (body) {
      // If the message has content
      setMessages((prev) => [...prev, { from, body: body.textContent }]); // Update the message list
    }
    return true; // Return true to keep the handler active for future messages
  };

  // Handle sending a message
  const handleSendMessage = () => {
    const client = clientRef.current; // Obtain the reference to the XMPPClient instance
    client.sendMessage(to, message); // Send the message to the specified JID
    setMessages((prev) => [...prev, { from: "Me", body: message }]); // Add the sent message to the message list with "Me" as the sender
    setMessage(""); // Clear the message input field after sending
  };

  return (
    <div>
      {!connected ? (
        // Display the connection form if not connected
        <div>
          <h2>Conectar a XMPP</h2>
          <input
            type="text"
            placeholder="JID" // Placeholder text for JID input
            value={jid} // Bind input value to jid state
            onChange={(e) => setJid(e.target.value)} // Update jid state on input change
          />
          <input
            type="password"
            placeholder="Password" // Placeholder text for password input
            value={password} // Bind input value to password state
            onChange={(e) => setPassword(e.target.value)} // Update password state on input change
          />
          <button onClick={handleConnect}>Conectar</button> {/* Connect button */}
        </div>
      ) : (
        // Display the chat interface if connected
        <div>
          <h2>Chat</h2>
          <input
            type="text"
            placeholder="To" // Placeholder text for the recipient JID
            value={to} // Bind input value to to state
            onChange={(e) => setTo(e.target.value)} // Update to state on input change
          />
          <textarea
            placeholder="Message" // Placeholder text for the message input
            value={message} // Bind textarea value to message state
            onChange={(e) => setMessage(e.target.value)} // Update message state on input change
          />
          <button onClick={handleSendMessage}>Enviar</button> {/* Send button */}
          <div>
            <h3>Mensajes:</h3>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}>
                  <strong>{msg.from}:</strong> {msg.body} {/* Display sender and message */}
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
