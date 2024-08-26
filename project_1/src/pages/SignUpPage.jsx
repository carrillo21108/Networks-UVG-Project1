import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SignUpForm from "../components/SignUpForm";
import { useXMPPClient } from '../contexts/XMPPClientContext';

import styles from './styles/SignUpPage.module.css'; // Import the CSS module for styling

const SignUpPage = () => {
  const navigate = useNavigate(); // Hook to navigate programmatically
  const client = useXMPPClient(); // Get the XMPP client from context

  // State hook to track if the user has registered successfully
  const [registered, setRegistered] = useState(false);

  // Effect hook to redirect to the home page after successful registration
  useEffect(() => {
    if (registered) {
        console.log("Registered!"); // Log the successful registration
        navigate("/"); // Navigate to the home page
    }
  }, [registered]); // Dependency array with `registered`, so it runs when `registered` changes

  // Function to handle the signup process
  const handleSignUp = (username, fullName, email, password) => {
    // Call the XMPP client's signup method and update the `registered` state on success
    client.signup(username, fullName, email, password, () => setRegistered(true));
  };

  return (
    <div className={styles.signUpPage}>
      <h1>Sign Up</h1>
      <div className={styles.signUpForm}>
        <SignUpForm onSignUp={handleSignUp} /> {/* Render the sign-up form and pass down the handler */}
      </div>
      <Link to="/" className={styles.link}>
        Already have an account? Log in here {/* Link to navigate to the login page */}
      </Link>
    </div>
  );
};

export default SignUpPage;
