import React, { useState, useEffect } from "react";
import { useXMPPClient } from '../contexts/XMPPClientContext'; // Import XMPP client context
import styles from './styles/ContactsPage.module.css'; // Import CSS module for styling

const ContactsPage = () => {
  const client = useXMPPClient(); // Retrieve the XMPP client instance from context
  const [contacts, setContacts] = useState({}); // State hook to store contacts

  // useEffect to fetch the roster and set contacts when the component mounts
  useEffect(() => {
    client.setOnRosterReceived(setContacts); // Set the callback for receiving the roster
    client.fetchRoster(); // Fetch the roster from the XMPP server
  }, [client]); // Dependency array includes client to re-run if client changes

  return (
    <div className={styles.contactsPage}>
      <h1>Contacts</h1> {/* Page title */}
      
      {/* Conditionally render content based on whether there are contacts */}
      {Object.keys(contacts).length === 0 ? (
        <p>No contacts added</p>
      ) : (
        <ul className={styles.contactList}>
          {/* Map through the contacts object to display each contact */}
          {Object.entries(contacts).map(([jid, contact]) => (
            <li key={jid} className={styles.contactItem}>
              {/* Display the first letter of the JID in a circle */}
              <div className={styles.circle}>
                {contact.jid.charAt(0).toUpperCase()}
              </div>
              {/* Display the full JID of the contact */}
              <span className={styles.contactJid}>{contact.jid}</span>
              
              {/* Display the contact's status and status message */}
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