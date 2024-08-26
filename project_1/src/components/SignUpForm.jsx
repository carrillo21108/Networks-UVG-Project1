import React, { useState } from "react";
import styles from './styles/Form.module.css'; // Import the CSS module for styling the form

const SignUpForm = ({ onSignUp }) => {
  // State hooks to manage input values for the form fields
  const [username, setUsername] = useState("");  // State for username input
  const [fullname, setFullname] = useState("");  // State for full name input
  const [email, setEmail] = useState("");        // State for email input
  const [password, setPassword] = useState("");  // State for password input

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    onSignUp(username, fullname, email, password); // Invoke the onSignUp prop function with form data
  };

  return (
    // Form element with an onSubmit handler to manage the form submission
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Input field for username */}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={styles.input} // Apply CSS styles to the input
      />
      {/* Input field for full name */}
      <input
        type="text"
        placeholder="Full name"
        value={fullname}
        onChange={(e) => setFullname(e.target.value)}
        className={styles.input} // Apply CSS styles to the input
      />
      {/* Input field for email */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input} // Apply CSS styles to the input
      />
      {/* Input field for password */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input} // Apply CSS styles to the input
      />
      {/* Submit button with a pen emoji */}
      <button type="submit">&#9997; Register</button>
    </form>
  );
};

export default SignUpForm;