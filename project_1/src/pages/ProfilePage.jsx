import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useXMPPClient } from '../contexts/XMPPClientContext';
import styles from './styles/ProfilePage.module.css';

const ProfilePage = ({ onLogout }) => {
  const client = useXMPPClient(); // Retrieve the XMPP client from context

  // State hooks to manage JID initial, status, and status message
  const [jidInitial, setJidInitial] = useState("");
  const [status, setStatus] = useState(client.status);
  const [statusMessage, setStatusMessage] = useState(client.statusMessage);

  const [disconnected, setDisconnected] = useState(false); // Track disconnection state
  const navigate = useNavigate(); // Hook to navigate programmatically

  // Effect to handle user logout and redirection after disconnection
  useEffect(() => {
    if (disconnected) {
      onLogout(); // Trigger the logout process
      navigate("/"); // Redirect to the login page
    }
  }, [disconnected]); // Dependency array to re-run effect when `disconnected` changes

  // Function to handle the logout process
  const handleLogout = () => {
    client.disconnect(); // Disconnect the user from the XMPP server
    setDisconnected(true); // Set `disconnected` to true to trigger the logout effect
  };

  // Effect to update status on the XMPP server whenever `status` changes
  useEffect(() => {
    if (client) {
      client.updateStatus(status, statusMessage); // Update the user's status
    }
  }, [status]); // Dependency on `status` to re-run the effect when it changes

  // Effect to set the JID initial (first letter) when the client's JID is available
  useEffect(() => {
    if (client.jid) {
      setJidInitial(client.jid.charAt(0).toUpperCase()); // Set the first character of JID as an uppercase initial
    }
  }, [client]); // Dependency on the `client` to update when it changes

  // Function to handle status message update
  const handleStatusMessageUpdate = () => {
    if (client) {
      client.updateStatus(status, statusMessage); // Update the status message on the server
    }
  };

  // Function to handle account deletion
  const handleDeleteAccount = () => {
    client.deleteAccount(handleLogout); // Delete the account and logout
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.circle}>
        {jidInitial} {/* Display the initial of the user's JID */}
      </div>
      <h1 className={styles.profileTitle}>Profile</h1>

      <div className={styles.profileItem}>
        <label className={styles.profileLabel}>JID:</label>
        <span className={styles.profileValue}>{client.jid}</span> {/* Display the user's JID */}
      </div>

      <div className={styles.profileItem}>
        <label className={styles.profileLabel}>Status:</label>
        <select
          className={`${styles.profileSelect} ${styles[status]}`} // Apply styles dynamically based on the status
          value={status}
          onChange={(e) => setStatus(e.target.value)} // Update status on change
        >
          <option value="online" className={`${styles.contactStatus} ${styles.online}`}>Online</option>
          <option value="away" className={`${styles.contactStatus} ${styles.away}`}>Away</option>
          <option value="dnd" className={`${styles.contactStatus} ${styles.dnd}`}>Do Not Disturb</option>
          <option value="offline" className={`${styles.contactStatus} ${styles.offline}`}>Offline</option>
        </select>
      </div>

      <div className={styles.profileItem}>
        <label className={styles.profileLabel}>Status Message:</label>
        <div className={styles.statusMessageContainer}>
          <input
            type="text"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)} // Update status message on input change
            className={styles.profileInput}
          />
          <button
            onClick={handleStatusMessageUpdate} // Update status message on button click
            className={styles.updateButton}
          >
            ✓
          </button>
        </div>
      </div>

      <button
        onClick={handleDeleteAccount} // Trigger account deletion on button click
        className={styles.deleteButton}
      >
        &#129529; Delete {/* Display a delete icon (crossbones) */}
      </button>
    </div>
  );
};

export default ProfilePage;