import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ChatsPage from "./pages/ChatsPage";
import SignUpPage from "./pages/SignUpPage";
import SideMenu from "./components/SideMenu";
import ContactsPage from "./pages/ContactsPage";
import ProfilePage from "./pages/ProfilePage";

import styles from './App.module.css';

import { XMPPClientProvider } from './contexts/XMPPClientContext';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State for authentication
  
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <XMPPClientProvider>
      <Router>
      <div className={styles.appContainer}>
        {isAuthenticated && <SideMenu onLogout={handleLogout}/>}
        <div className={isAuthenticated ? styles.content : styles.fullContent}>
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/chats" /> : <LoginPage onLogin={handleLogin}/>}
            />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/chats" element={isAuthenticated ? <ChatsPage /> : <Navigate to="/" />} />
            <Route path="/contacts" element={isAuthenticated ? <ContactsPage /> : <Navigate to="/" />} />
            <Route path="/profile" element={isAuthenticated ? <ProfilePage onLogout={handleLogout}/> : <Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
    </XMPPClientProvider>
  );
};

export default App;
