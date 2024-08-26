import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import ConnectionForm from "../components/ConnectionForm"; // Import the connection form component
import { useXMPPClient } from '../contexts/XMPPClientContext'; // Import the XMPP client context

import styles from './styles/LoginPage.module.css'; // Import the CSS module for styling

const LoginPage = ({ onLogin }) => {
  const client = useXMPPClient(); // Retrieve the XMPP client from context

  // Hook to manage connection status
  const [connected, setConnected] = useState(false);

  // useEffect to trigger onLogin callback when the user is connected
  useEffect(() => {
    if (connected) {
        onLogin(); // If connected, call the onLogin function passed as a prop
    }
    return () => {
      // Cleanup function if needed (not used in this case)
    };
  }, [connected]); // Dependency array: runs when the `connected` state changes

  // Function to handle user login
  const handleLogin = (jid, password) => {
    client.connect(jid, password, () => setConnected(true)); // Connect to the XMPP server and set `connected` to true on success
  };

  return (
    <div className={styles.loginPage}>
      <h1>Log In</h1> {/* Page title */}
      <div className={styles.connectionForm}>
        <ConnectionForm onConnect={handleLogin} /> {/* Render the ConnectionForm component and pass the handleLogin function */}
      </div>
      <Link to="/signup" className={styles.link}>
        Don't have an account? Sign up here {/* Link to the signup page */}
      </Link>
    </div>
  );
};

export default LoginPage;