// src/components/SideMenu.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/SideMenu.module.css';

const SideMenu = () => {
  return (
    <div className={styles.sideMenu}>
      <nav>
        <ul>
          <li>
            <Link to="/">Login</Link>
          </li>
          <li>
            <Link to="/chats">Chats</Link>
          </li>
          <li>
            <Link to="/contacts">Contacs</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default SideMenu;
