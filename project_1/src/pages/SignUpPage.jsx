import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignUpForm from "../components/SignUpForm";
import { useXMPPClient } from '../contexts/XMPPClientContext';

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
    <div>
      <h1>Sign Up</h1>
      <SignUpForm onSignUp={handleSignUp} />
    </div>
  );
};

export default SignUpPage;
