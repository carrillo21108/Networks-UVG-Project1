import { Strophe, $pres, $msg } from "strophe.js";

export class XMPPClient {
  constructor(url) {
    // "ws://alumchat.lol:7070/ws/"
    this.connection = new Strophe.Connection(url); // Initialize the connection; // Declare the connection variable
    this.roster = {}; // Declare the roster object
    // Listen for all presence updates
    this.connection.addHandler(this.handlePresence.bind(this), null, "presence");
    this.onRosterReceived = () => {}; // Declare the roster update callback
  }

  connect(jid, password, onConnect) {
    this.connection.connect(jid, password, (status) => {
        if (status === Strophe.Status.CONNECTED) {
            console.log("Connected to XMPP server");

            // Send the initial presence stanza after a successful connection
            const presence = $pres()
                .c("show").t("online").up() // Optional: Set the availability status
                .c("status").t("Available").up() // Optional: Set a custom status message
                .c("priority").t("1"); // Optional: Set the resource priority

            this.connection.send(presence.tree());

            // Trigger the onConnect callback to notify that the connection is established
            onConnect();
        } else if (status === Strophe.Status.AUTHFAIL) {
            console.log("Authentication failed");
        }
    });
  }

  sendMessage(to, body) {
    const message = $msg({
      to,
      type: "chat",
    }).c("body").t(body);
    
    this.connection.send(message.tree());
  }

  signup(username, fullName, email, password, onSuccess, onError) {

    this.connection.connect("car_21108@alumchat.lol", "prueba2024", (status) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log("Connected to XMPP server for registration");

        const domain = "alumchat.lol";
        const registerIQ = $iq({
          type: "set",
          to: domain,
        }).c("query", { xmlns: "jabber:iq:register" })
          .c("username").t(username).up()
          .c("password").t(password).up()
          .c("name").t(fullName).up()
          .c("email").t(email);

        // Enviar la solicitud de registro al servidor
        this.connection.sendIQ(registerIQ, (iq) => {
          console.log("Registration successful", iq);
          this.connection.disconnect(); // Desconectar después del registro
          onSuccess();
        }, (error) => {
          console.error("Registration failed", error);
          this.connection.disconnect(); // Desconectar en caso de error
          onError(error);
        });

      } else if (status === Strophe.Status.CONNFAIL) {
        console.error("Connection to XMPP server failed");
        onError(new Error("Failed to connect to XMPP server"));
      }
    });
  }

  fetchRoster() {
    const rosterIQ = $iq({ 
      type: "get" 
    }).c("query", { xmlns: "jabber:iq:roster" });

    this.connection.sendIQ(rosterIQ, (iq) => {
      console.log("Roster received", iq);
      const contacts = {};
      const items = iq.getElementsByTagName("item");
      for (let i = 0; i < items.length; i++) {
        const jid = items[i].getAttribute("jid");
        contacts[jid] = jid in this.roster ? this.roster[jid] : { jid, status: "offline" }; 
        this.sendPresenceProbe(jid); // Send a presence probe to each contact
      }
      this.roster = contacts;
      this.onRosterReceived({ ...this.roster }); // Trigger the first state update
    });
  }

  // Generic presence handler that can handle any presence stanza
  handlePresence(presence) {
      console.log("Presence stanza received:", presence);
      const fullJid = presence.getAttribute("from");
      const from = Strophe.getBareJidFromJid(fullJid); // Normalize to bare JID
      const type = presence.getAttribute("type");
      let status = "";

      if (type === "unavailable") {
          status = "offline";
      } else {
          status = presence.getElementsByTagName("show")[0]?.textContent || "online";
      }

      this.roster[from] = { jid: from, status }; // Update the contact status
      this.onRosterReceived({ ...this.roster }); // Trigger the first state update

      return true; // Return true to keep the handler active
  }

  sendPresenceProbe(jid) {
    const probe = $pres({ type: "probe", to: jid });
    this.connection.send(probe.tree());
  }  

  disconnect() {
    // Send a presence stanza indicating the user is going offline
    this.connection.send($pres({ type: "unavailable" }).tree());

    // Disconnect from the XMPP server
    this.connection.disconnect();
    console.log("Disconnected from XMPP server");
  }

  setOnRosterReceived(callback) {
    this.onRosterReceived = callback;
  }
}
