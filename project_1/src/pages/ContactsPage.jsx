import React, { useState, useEffect } from "react";
import { useXMPPClient } from '../contexts/XMPPClientContext';
import styles from './styles/ContactsPage.module.css';

const ContactsPage = () => {
  const client = useXMPPClient();
  const [contacts, setContacts] = useState({});

  useEffect(() => {
    client.setOnRosterReceived(setContacts);
    client.fetchRoster();
  }, [client]);

  return (
    <div className={styles.contactsPage}>
      <h1>Contacts</h1>
      {Object.keys(contacts).length === 0 ? (
        <p>No contacts added</p>
      ) : (
      <ul className={styles.contactList}>
        {Object.entries(contacts).map(([jid, contact]) => (
          <li key={jid} className={styles.contactItem}>
            <div className={styles.circle}>
              {contact.jid.charAt(0).toUpperCase()}
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
          </li>
        ))}
      </ul>
      )}
    </div>
  );
};

export default ContactsPage;
