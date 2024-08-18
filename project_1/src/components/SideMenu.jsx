// src/components/SideMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles/SideMenu.module.css';
import { useXMPPClient } from '../contexts/XMPPClientContext';

const SideMenu = ({ onLogout }) => {
  const client = useXMPPClient();

  // Hook
  const [disconnected, setDisconnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (disconnected) {
        onLogout();
        navigate("/"); // Redirect to the login page
    }
    return () => {
    };
  }, [disconnected]);

  const handleLogout = (e) => {
    e.preventDefault();
    client.disconnect(); // Disconnect from the XMPP server
    setDisconnected(true); // Update state to trigger the useEffect
  };

  return (
    <div className={styles.sideMenu}>
      <nav>
        <ul>
          <li>
            <Link to="/chats">&#128488; Chats</Link>
          </li>
          <li>
            <Link to="/contacts">&#128101; Contacs</Link>
          </li>
          <li>
            <Link to="/profile">&#128100; Profile</Link>
          </li>
        </ul>
      </nav>

      <div className={styles.logoutLink}>
        <a href="/" onClick={handleLogout}>&#128274; Log out</a>
      </div>
    </div>
  );
};

export default SideMenu;
