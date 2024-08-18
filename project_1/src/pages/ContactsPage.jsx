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
      <ul className={styles.contactList}>
        {Object.entries(contacts).map(([jid, contact]) => (
          <li key={jid} className={styles.contactItem}>
            <span className={styles.contactJid}>{contact.jid}</span>
            <span className={`${styles.contactStatus} ${styles[contact.status]}`}>
              {contact.status}
            </span>
            <span className={styles.contactStatusMessage}>
              {contact.statusMessage || "No status message"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactsPage;
