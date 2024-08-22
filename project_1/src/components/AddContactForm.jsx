import React, { useState } from 'react';
import styles from './styles/Form.module.css';

const AddContactForm = ({ onAddContact }) => {
  // Hooks
  const [jid, setJid] = useState('');

  const handleAddContact = (e) => {
    e.preventDefault();
    onAddContact(jid);
    
    setJid('');
  };

  return (
    <form className={styles.form} onSubmit={handleAddContact}>
        <input
            type="text"
            placeholder="JID"
            className={styles.input}
            value={jid}
            onChange={(e) => setJid(e.target.value)}
            required
        />
        <button type="submit" className={styles.button}>&#128221; Add Contact</button>
    </form>
  );
};

export default AddContactForm;