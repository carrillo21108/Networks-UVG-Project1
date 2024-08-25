import React, { useState, useEffect, useRef } from "react";
import { useXMPPClient } from "../contexts/XMPPClientContext";
import styles from "./styles/ChatsPage.module.css";

const ChatsPage = () => {
  const client = useXMPPClient();
  const [contacts, setContacts] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageHistory, setMessageHistory] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null); // Reference to the last message
  const processedMessages = useRef(new Set()); // Track processed messages

  useEffect(() => {
    client.setOnMessageReceived(handleMessageReceived);
    client.setOnFileReceived(handleFileReceived);
    client.setOnRosterReceived(setContacts);
    client.fetchRoster();
    client.fetchOldMessages();
  }, [client]);

  const handleMessageReceived = (to, from, message, timestamp) => {
    const userJid = from === client.jid ? to : from;
    const messageId = `${userJid}-${timestamp.getTime()}-${message}`; // Create a unique ID for the message

    if (processedMessages.current.has(messageId)) {
      return;
    }

    processedMessages.current.add(messageId);

    setMessageHistory((prev) => {
      const updatedMessages = [...(prev[userJid] || []), {
        from,
        message,
        timestamp
      }];
      updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      return {
        ...prev,
        [userJid]: updatedMessages,
      };
    });
  };

  const handleFileReceived = (to, from, fileName, fileUrl, timestamp) => {
    const userJid = from === client.jid ? to : from;
    const message = from === client.jid ? "File" : "Received file";
    const messageId = `${userJid}-${timestamp.getTime()}-${fileName}`;
  
    if (processedMessages.current.has(messageId)) {
      return;
    }
  
    processedMessages.current.add(messageId);
  
    setMessageHistory((prev) => {
      const updatedMessages = [...(prev[userJid] || []), {
        from,
        message: `${message}: <a href="${fileUrl}" download="${fileName}">${fileName}</a>`,
        timestamp,
        isFile: true, // Mark it as a file message
      }];
      updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
      return {
        ...prev,
        [userJid]: updatedMessages,
      };
    });
  };  

  const handleSendMessage = () => {
    if (selectedContact && newMessage.trim()) {
      const currentTimestamp = new Date();
      client.sendMessage(selectedContact, newMessage);
      handleMessageReceived(selectedContact, client.jid, newMessage, currentTimestamp); // Optimistically update the chat
      console.log(`Message sent to ${selectedContact}: ${newMessage}`);
      setNewMessage("");
    }
  };

  const handleSendFile = (event) => {
    if (selectedContact && event.target.files[0]) {
      const file = event.target.files[0];
      client.sendFile(selectedContact, file);
      console.log(`File selected for sending: ${file.name}`);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageHistory, selectedContact]); // Trigger scroll whenever messages or contact changes

  return (
    <div className={styles.messageTrayContainer}>
      <div className={styles.contactList}>
        {Object.entries(contacts).map(([jid, contact]) => (
          <div
            key={jid}
            className={`${styles.contactItem} ${selectedContact === jid ? styles.selectedContact : ""}`}
            onClick={() => setSelectedContact(jid)}
          >
            <div className={styles.circle}>
              {jid.charAt(0).toUpperCase()}
            </div>
            <span className={styles.contactJid}>{contact.jid}</span>
            <div className={styles.statusContainer}>
              <span className={`${styles.contactStatus} ${styles[contact.status]}`}>
                {contact.status}
              </span>
              <span className={styles.contactStatusMessage}>&#128488;&nbsp;
                {contact.statusMessage || "No status message"}
              </span>
            </div>
          </div>
        ))}
      </div>
  
      <div className={styles.messageHistory}>
        {selectedContact ? (
          <>
            <div className={styles.messages}>
              {(messageHistory[selectedContact] || []).map((msg, idx) => (
                <div key={idx} className={msg.from === client.jid ? styles.myMessage : styles.theirMessage}>
                  <div
                    className={styles.messageContent}
                    dangerouslySetInnerHTML={{ __html: msg.message }}
                  />
                  <div className={styles.messageTimestamp}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    &nbsp;&nbsp;
                    {msg.timestamp.toLocaleDateString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* Scrolls to last message */}
            </div>
            <div className={styles.messageInputContainer}>
              <input
                type="file"
                onChange={handleSendFile}
                className={styles.fileInput}
              />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className={styles.messageInput}
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                className={styles.sendButton}
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noContactSelected}>Select a contact to view messages</div>
        )}
      </div>
    </div>
  );  
};

export default ChatsPage;
