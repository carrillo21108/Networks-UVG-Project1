// src/components/SideMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link for navigation and useNavigate for programmatic navigation
import styles from './styles/SideMenu.module.css'; // Import CSS module for styling
import { useXMPPClient } from '../contexts/XMPPClientContext'; // Import the XMPP client context

const SideMenu = ({ onLogout }) => {
  const client = useXMPPClient(); // Get the XMPP client instance from context

  // State hook to track if the user has disconnected
  const [disconnected, setDisconnected] = useState(false);
  const navigate = useNavigate(); // Hook to navigate programmatically

  // Effect hook that runs when `disconnected` state changes
  useEffect(() => {
    if (disconnected) {
      onLogout(); // Trigger the logout function passed as a prop
      navigate("/"); // Redirect the user to the login page
    }
    return () => {
      // Cleanup logic (if needed) when the component unmounts or `disconnected` changes
    };
  }, [disconnected]);

  // Handler function to disconnect from the XMPP server and update the state
  const handleLogout = (e) => {
    e.preventDefault(); // Prevent the default link behavior
    client.disconnect(); // Disconnect from the XMPP server
    setDisconnected(true); // Set the disconnected state to true, triggering the useEffect
  };

  return (
    // Side menu container with a navigation list and logout link
    <div className={styles.sideMenu}>
      <nav>
        <ul>
          {/* Navigation links to different pages in the application */}
          <li>
            <Link to="/chats">&#128490; Chats</Link>
          </li>
          <li>
            <Link to="/contacts">&#128209; Contacts</Link>
          </li>
          <li>
            <Link to="/profile">&#128100; Profile</Link>
          </li>
          <li>
            <Link to="/addContact">&#128101; Add Contact</Link>
          </li>
          <li>
            <Link to="/notifications">&#128227; Notifications</Link>
          </li>
        </ul>
      </nav>

      {/* Logout link that triggers the handleLogout function */}
      <div className={styles.logoutLink}>
        <a href="/" onClick={handleLogout}><b>&#128274; Log out</b></a>
      </div>
    </div>
  );
};

export default SideMenu;