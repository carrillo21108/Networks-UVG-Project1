import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignUpForm from "../components/SignUpForm";
import { useXMPPClient } from '../contexts/XMPPClientContext';

import styles from './styles/SignUpPage.module.css'; // Import the CSS module

const SignUpPage = () => {
  const navigate = useNavigate();
  const client = useXMPPClient();

  // Hook
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (registered) {
        console.log("Registered!");
        navigate("/");
    }
    return () => {
    };
  }, [registered]);

  const handleSignUp = (username, fullName, email, password) => {
    client.signup(username, fullName, email, password, () => setRegistered(true));
  };

  return (
    <div className={styles.signUpPage}>
      <h1>Sign Up</h1>
      <div className={styles.connectionForm}>
        <SignUpForm onSignUp={handleSignUp} />
      </div>
    </div>
  );
};

export default SignUpPage;
