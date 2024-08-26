import React, { useState, useEffect } from "react";
import { useXMPPClient } from '../contexts/XMPPClientContext';
import styles from './styles/NotificationsPage.module.css';

const NotificationsPage = () => {
  const client = useXMPPClient(); // Get the XMPP client from context
  const [requests, setRequests] = useState([]); // State to store subscription requests

  // useEffect hook to fetch and listen for subscription requests
  useEffect(() => {
    client.fetchSubscriptionRequests(setRequests); // Fetch existing subscription requests on component mount
    client.setOnSubscriptionReceived(setRequests); // Set up listener for new incoming subscription requests
  }, [client]); // Dependencies ensure this effect runs when the client instance changes

  // Function to handle accepting a subscription request
  const handleAccept = (jid) => {
    client.acceptSubscription(jid); // Accept the subscription for the given JID
  };

  // Function to handle rejecting a subscription request
  const handleReject = (jid) => {
    client.rejectSubscription(jid); // Reject the subscription for the given JID
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
              <span>{jid}</span> {/* Display the JID of the subscription request */}
              <div>
                <button 
                  onClick={() => handleAccept(jid)} // Accept button handler
                  className={styles.acceptButton}
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleReject(jid)} // Reject button handler
                  className={styles.rejectButton}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
