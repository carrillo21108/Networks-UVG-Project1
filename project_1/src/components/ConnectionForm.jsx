import React, { useState } from "react";
import styles from './styles/Form.module.css'; // Import the CSS module for styling the form

const ConnectionForm = ({ onConnect }) => {
  // State hooks to manage the form input values for JID and password
  const [jid, setJid] = useState("");
  const [password, setPassword] = useState("");

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    onConnect(jid, password); // Trigger the onConnect function passed as a prop with the JID and password
  };

  return (
    // Form element with a submit handler
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Input for JID (Email) */}
      <input
        type="text"
        placeholder="Email" // Placeholder text
        value={jid} // Bind the input value to the JID state
        onChange={(e) => setJid(e.target.value)} // Update JID state on input change
        className={styles.input} // Apply styles from the CSS module
      />
      {/* Input for Password */}
      <input
        type="password"
        placeholder="Password" // Placeholder text
        value={password} // Bind the input value to the password state
        onChange={(e) => setPassword(e.target.value)} // Update password state on input change
        className={styles.input} // Apply styles from the CSS module
      />
      {/* Submit button */}
      <button type="submit" className={styles.button}>
        &#128275; Connect {/* Emoji with label for the button */}
      </button>
    </form>
  );
};

export default ConnectionForm;

