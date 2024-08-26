import React from "react";
import AddContactForm from "../components/AddContactForm";
import { useXMPPClient } from '../contexts/XMPPClientContext';

import styles from './styles/AddContactPage.module.css'; // Import the CSS module

// This component handles the "Add Contact" page
const AddContactPage = ({ onLogin }) => {
  const client = useXMPPClient(); // Access the XMPP client instance from context

  // Function to handle adding a new contact
  const handleAdd = (jid) => {
    client.sendSubscriptionRequest(jid); // Send a subscription request to the provided JID
  };

  return (
    <div className={styles.addContactPage}>
      <h1>Add Contact</h1> {/* Page title */}
      <div className={styles.addContactForm}>
        {/* Render the AddContactForm component, passing the handleAdd function as a prop */}
        <AddContactForm onAddContact={handleAdd} />
      </div>
    </div>
  );
};

export default AddContactPage;
