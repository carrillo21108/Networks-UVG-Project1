import { Strophe, $pres, $msg } from "strophe.js";

export class XMPPClient {
  constructor(url) {
    // "ws://alumchat.lol:7070/ws/"
    this.connection = new Strophe.Connection(url); // Initialize the connection; // Declare the connection variable
    this.roster = {}; // Declare the roster object
  }

  connect(jid, password, onConnect) {
    //this.connection = new Strophe.Connection("wss://tigase.im:5291/xmpp-websocket"); // Initialize the connection

    this.connection.connect(jid, password, (status) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log("Connected to XMPP server");
        // this.connection.addHandler(onMessage, null, "message", null, null, null);
        this.connection.send($pres().tree());
        onConnect();
      } else if (status === Strophe.Status.DISCONNECTED) {
        console.log("Disconnected from XMPP server");
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

  fetchRoster(onRosterReceived) {
    const rosterIQ = $iq({ 
      type: "get" 
    }).c("query", { xmlns: "jabber:iq:roster" });

    this.connection.sendIQ(rosterIQ, (iq) => {
      const contacts = {};
      const items = iq.getElementsByTagName("item");
      for (let i = 0; i < items.length; i++) {
        const jid = items[i].getAttribute("jid");
        contacts[jid] = { jid, status: "offline" };
      }
      this.roster = contacts;
      onRosterReceived({ ...this.roster }); // Trigger the first state update
    });

    // Listen for presence updates
    this.connection.addHandler((presence) => {
      const from = Strophe.getBareJidFromJid(presence.getAttribute("from")); // Normalize to bare JID
      const show = presence.getElementsByTagName("show")[0]?.textContent || "online";

      this.roster[from].status = show;

      onRosterReceived({ ...this.roster }); // Trigger a re-render with a new object
    }, null, "presence");
  }

}
