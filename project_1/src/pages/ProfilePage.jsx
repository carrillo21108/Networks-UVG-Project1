import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import { useXMPPClient } from '../contexts/XMPPClientContext';
import styles from './styles/ProfilePage.module.css';

const ProfilePage = ({ onLogout }) => {
  const client = useXMPPClient();

  const [jidInitial, setJidInitial] = useState("");
  const [status, setStatus] = useState(client.status);
  const [statusMessage, setStatusMessage] = useState(client.statusMessage);

  // Hook
  const [disconnected, setDisconnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (disconnected) {
        onLogout();
        navigate("/"); // Redirect to the login page
    }
    return () => {
    };
  }, [disconnected]);

  const handleLogout = () => {
    client.disconnect(); // Disconnect from the XMPP server
    setDisconnected(true); // Update state to trigger the useEffect
  };

  useEffect(() => {
    if (client) {
      client.updateStatus(status, statusMessage);
    }
  }, [status]);

  useEffect(() => {
    if (client.jid) {
      setJidInitial(client.jid.charAt(0).toUpperCase());
    }
  }, [client]);

  const handleStatusMessageUpdate = () => {
    if (client) {
      client.updateStatus(status, statusMessage);
    }
  };

  const handleDeleteAccount = () => {
    client.deleteAccount(handleLogout);
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.circle}>
        {jidInitial}
      </div>
      <h1 className={styles.profileTitle}>Profile</h1>
      <div className={styles.profileItem}>
        <label className={styles.profileLabel}>JID:</label>
        <span className={styles.profileValue}>{client.jid}</span>
      </div>
      <div className={styles.profileItem}>
        <label className={styles.profileLabel}>Status:</label>
        <select
          className={`${styles.profileSelect} ${styles[status]}`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
            onChange={(e) => setStatusMessage(e.target.value)}
            className={styles.profileInput}
          />
          <button
            onClick={handleStatusMessageUpdate}
            className={styles.updateButton}
          >
            ✓
          </button>
        </div>
      </div>

      <button
        onClick={handleDeleteAccount}
        className={styles.deleteButton}
      >
        &#9746; Delete Account
      </button>
    </div>
  );
};

export default ProfilePage;