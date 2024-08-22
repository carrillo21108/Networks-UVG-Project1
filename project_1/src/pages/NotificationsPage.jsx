import React, { useState, useEffect } from "react";
import { useXMPPClient } from '../contexts/XMPPClientContext';
import styles from './styles/NotificationsPage.module.css';

const NotificationsPage = () => {
  const client = useXMPPClient();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    client.fetchSubscriptionRequests(setRequests);
    client.setOnSubscriptionReceived(setRequests);
  }, [client]);

  const handleAccept = (jid) => {
    client.acceptSubscription(jid);
  };

  const handleReject = (jid) => {
    client.rejectSubscription(jid);
  };

  return (
    <div className={styles.notificationsPage}>
      <h1>Notifications</h1>
      {requests.length === 0 ? (
        <p>No subscription requests</p>
      ) : (
        <ul className={styles.requestsList}>
          {requests.map((jid) => (
            <li key={jid} className={styles.requestItem}>
              <span>{jid}</span>
              <button 
                onClick={() => handleAccept(jid)} 
                className={styles.acceptButton}
              >
                Accept
              </button>
              <button 
                onClick={() => handleReject(jid)} 
                className={styles.rejectButton}
              >
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
