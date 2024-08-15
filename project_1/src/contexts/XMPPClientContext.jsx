import React, { createContext, useContext, useRef } from 'react';
import { XMPPClient } from '../services/XMPPClient';

const XMPPClientContext = createContext(null);

export const XMPPClientProvider = ({ children }) => {
  const clientRef = useRef(new XMPPClient("ws://alumchat.lol:7070/ws/"));

  return (
    <XMPPClientContext.Provider value={clientRef.current}>
      {children}
    </XMPPClientContext.Provider>
  );
};

export const useXMPPClient = () => {
  return useContext(XMPPClientContext);
};