import React from "react";
import AddContactForm from "../components/AddContactForm";
import { useXMPPClient } from '../contexts/XMPPClientContext';

import styles from './styles/AddContactPage.module.css'; // Import the CSS module

const AddContactPage = ({ onLogin }) => {
  const client = useXMPPClient();

  const handleAdd = (jid, alias) => {
    client.addContact(jid, alias);
  };

  return (
    <div className={styles.addContactPage}>
      <h1>Add Contact</h1>
      <div className={styles.addContactForm}>
        <AddContactForm onAddContact={handleAdd} />
      </div>
    </div>
  );
};

export default AddContactPage;