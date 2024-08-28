import React, { useState, useEffect, useRef } from "react";
import { useXMPPClient } from "../contexts/XMPPClientContext";
import styles from "./styles/ChatsPage.module.css";

const ChatsPage = () => {
  // Initialize XMPP client and state variables
  const client = useXMPPClient();
  const [contacts, setContacts] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageHistory, setMessageHistory] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null); // Reference to auto-scroll to the last message
  const processedMessages = useRef(new Set()); // Track processed messages to avoid duplicates

  // Set up message handlers and fetch initial data when the component mounts
  useEffect(() => {
    client.setOnMessageReceived(handleMessageReceived);
    client.setOnFileReceived(handleFileReceived);
    client.setOnRosterReceived(setContacts);
    client.setOnGroupMessageReceived(handleGroupMessageReceived);

    client.fetchRoster(); // Fetch contacts (roster)
    client.fetchOldMessages(); // Fetch message history
    client.fetchAllRooms(); // Fetch all group rooms the user is part of
  }, [client]);

  // Handle received direct messages
  const handleMessageReceived = (to, from, message, timestamp) => {
    const userJid = from === client.jid ? to : from; // Determine whether the message is sent or received
    const messageId = `${userJid}-${timestamp.getTime()}-${message}`; // Unique ID for each message

    // Check if the message has already been processed
    if (processedMessages.current.has(messageId)) {
      return;
    }

    processedMessages.current.add(messageId); // Mark this message as processed

    // Update message history state
    setMessageHistory((prev) => {
      const updatedMessages = [...(prev[userJid] || []), {
        from,
        message,
        timestamp
      }];
      updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort messages by timestamp

      return {
        ...prev,
        [userJid]: updatedMessages,
      };
    });
  };

  // Handle received files
  const handleFileReceived = (to, from, fileName, fileUrl, timestamp) => {
    const userJid = from === client.jid ? to : from;
    const message = from === client.jid ? "File" : "Received file";
    const messageId = `${userJid}-${timestamp.getTime()}-${fileName}`;

    // Check if the file message has already been processed
    if (processedMessages.current.has(messageId)) {
      return;
    }

    processedMessages.current.add(messageId); // Mark this file message as processed

    // Update message history state with the file download link
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

  // Handle received group messages
  const handleGroupMessageReceived = (room, nickname, message, timestamp) => {
    const messageId = `${room}-${timestamp.getTime()}-${message}`; // Unique ID for the group message

    // Check if the group message has already been processed
    if (processedMessages.current.has(messageId)) {
      return;
    }

    processedMessages.current.add(messageId); // Mark this group message as processed

    // Update message history state for the group
    setMessageHistory((prev) => {
      const updatedMessages = [...(prev[room] || []), {
        from: nickname,
        message,
        timestamp
      }];
      updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      return {
        ...prev,
        [room]: updatedMessages,
      };
    });
  };

  // Handle sending a message (either to a contact or a group)
  const handleSendMessage = () => {
    if (selectedContact && newMessage.trim()) {
      const currentTimestamp = new Date();

      if (selectedContact.includes("@conference")) {
        client.sendMessageToGroup(selectedContact, newMessage); // Send group message
      } else {
        client.sendMessage(selectedContact, newMessage); // Send direct message
        handleMessageReceived(selectedContact, client.jid, newMessage, currentTimestamp); // Optimistically update the chat
      }

      setNewMessage(""); // Clear the input field after sending
    }
  };

  // Handle sending a file to the selected contact or group
  const handleSendFile = (event) => {
    if (selectedContact && event.target.files[0]) {
      const file = event.target.files[0];
      client.sendFile(selectedContact, file); // Send the file
      console.log(`File selected for sending: ${file.name}`);
    }
  };

  // Function to create a new group
  const createGroup = () => {
    const groupName = prompt("Enter the group name:");
    if (groupName) {
      client.createGroup(groupName, client.jid);
    }
  };

  // Function to join an existing group
  const joinGroup = () => {
    const groupName = prompt("Enter the group name:");
    if (groupName) {
      client.joinGroup(groupName, client.jid);
    }
  };

  // Function to invite a contact to a group
  const inviteToGroup = () => {
    const contactJid = selectedContact;
    if (!contactJid) {
      alert("Select a contact to invite to a group.");
      return;
    }

    const groupJid = prompt("Enter the group JID to invite the contact to:");
    if (groupJid) {
      client.inviteToGroup(groupJid, contactJid, (response) => {
        alert(`Contact invited to group: ${groupJid}`);
      }, (err) => console.error("Group invitation failed", err));
    }
  };

  // Auto-scroll to the latest message when the message history or selected contact changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageHistory, selectedContact]);

  return (
    <div className={styles.messageTrayContainer}>
      <div className={styles.contactList}>
        <div className={styles.groupButtons}>
          <button onClick={createGroup} className={styles.groupButton}>&#128193; Create Group</button>
          <button onClick={joinGroup} className={styles.groupButton}>&#128194; Join Group</button>
        </div>
        {/* Display the list of contacts */}
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
              {/* Display the messages for the selected contact or group */}
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
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className={styles.messageInput}
                placeholder="Type a message..."
              />
              <label htmlFor="fileInput" className={styles.fileInputLabel}>
                &#128392;
              </label>
              <input
                type="file"
                id="fileInput"
                className={styles.fileInput}
                onChange={handleSendFile}
              />
              <button
                onClick={handleSendMessage}
                className={styles.sendButton}
                disabled={!newMessage.trim()}
              >
                &#128232;&nbsp;Send
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
