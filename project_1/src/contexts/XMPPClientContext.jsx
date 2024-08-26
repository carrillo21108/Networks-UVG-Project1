import React, { createContext, useContext, useRef } from 'react';
import { XMPPClient } from '../services/XMPPClient';

// Create a context to hold the XMPPClient instance
const XMPPClientContext = createContext(null);

export const XMPPClientProvider = ({ children }) => {
  // Create a reference to store the XMPPClient instance, initialized with the WebSocket URL
  const clientRef = useRef(new XMPPClient("ws://alumchat.lol:7070/ws/"));

  return (
    // Provide the XMPPClient instance to all child components via context
    <XMPPClientContext.Provider value={clientRef.current}>
      {children} {/* Render the children components that will use the XMPPClient */}
    </XMPPClientContext.Provider>
  );
};

// Custom hook to access the XMPPClient instance from the context
export const useXMPPClient = () => {
  return useContext(XMPPClientContext);
};
