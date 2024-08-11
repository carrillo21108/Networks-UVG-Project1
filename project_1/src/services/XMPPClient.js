import { Strophe, $pres, $msg } from "strophe.js";

export class XMPPClient {
  constructor() {
    this.connection = null; // Declare the connection variable
    this.estado = "aaaa";
  }

  connect(jid, password, onMessage, onConnect) {
    this.connection = new Strophe.Connection("wss://tigase.im:5291/xmpp-websocket"); // Initialize the connection
    this.estado = "bbbb";

    this.connection.connect(jid, password, (status) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log("Connected to XMPP server");
        this.connection.addHandler(onMessage, null, "message", null, null, null);
        this.connection.send($pres().tree());
        onConnect();
      } else if (status === Strophe.Status.DISCONNECTED) {
        console.log("Disconnected from XMPP server");
      } else if (status === Strophe.Status.AUTHFAIL) {
        console.log("Authentication failed");
      }
    });
    console.log(this.estado);
  }

  sendMessage(to, body) {
    console.log(this.estado);
    const message = $msg({
      to,
      type: "chat",
    }).c("body").t(body);
    
    this.connection.send(message.tree());
  }
}
