import React, { useState } from 'react';
import styles from './styles/Form.module.css';

const AddContactForm = ({ onAddContact }) => {
  // State hook to manage the JID input field
  const [jid, setJid] = useState('');

  // Function to handle form submission
  const handleAddContact = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    onAddContact(jid); // Trigger the onAddContact callback with the entered JID
    
    setJid(''); // Clear the JID input field after submission
  };

  return (
    <form className={styles.form} onSubmit={handleAddContact}>
      <input
        type="text"
        placeholder="JID" // Placeholder text for the JID input
        className={styles.input} // Apply CSS styles from the module
        value={jid} // Bind the input value to the jid state
        onChange={(e) => setJid(e.target.value)} // Update jid state on input change
        required // Ensure the input field is not empty when submitting
      />
      <button type="submit" className={styles.button}>
        &#128221; Add Contact
      </button>
    </form>
  );
};

export default AddContactForm;
