import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ConnectionForm from "../components/ConnectionForm";
import { useXMPPClient } from '../contexts/XMPPClientContext';

import styles from './styles/LoginPage.module.css'; // Import the CSS module

const LoginPage = ({ onLogin }) => {
  const client = useXMPPClient();

  // Hook
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (connected) {
        console.log("Connected!");
        onLogin();
    }
    return () => {
    };
  }, [connected]);

  const handleLogin = (jid, password) => {
    client.connect(jid, password, () => setConnected(true));
  };

  return (
    <div className={styles.loginPage}>
      <h1>Login</h1>
      <div className={styles.connectionForm}>
        <ConnectionForm onConnect={handleLogin} />
      </div>
      <Link to="/signup" className={styles.link}>
        Don't have an account? Sign up here
      </Link>
    </div>
  );
};

export default LoginPage;