import React, { useState } from "react";
import styles from './styles/Form.module.css'; // Import styles

const ConnectionForm = ({ onConnect }) => {
  // Hooks
  const [jid, setJid] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(jid, password);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="text"
        placeholder="Email"
        value={jid}
        onChange={(e) => setJid(e.target.value)}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
      />
      <button type="submit" className={styles.button}>Connect</button>
    </form>
  );
};

export default ConnectionForm;
