import { Strophe, $pres, $msg, $iq } from "strophe.js";

export class XMPPClient {
  constructor(url) {
    this.connection = new Strophe.Connection(url);
    this.domain = "alumchat.lol";
    
    this.roster = {}; 
    this.connection.addHandler(this.handlePresence.bind(this), null, "presence");
    this.onRosterReceived = () => {};
    this.jid = ""; 
  }

  connect(jid, password, onConnect) {
    this.connection.connect(jid, password, (status) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log("Connected to XMPP server");
        this.jid = jid;

        const presence = $pres()
          .c("show").t("online").up()
          .c("status").t("Available").up()
          .c("priority").t("1");

        this.connection.send(presence.tree());

        onConnect();
      } else if (status === Strophe.Status.AUTHFAIL) {
        console.log("Authentication failed");
      }
    });
  }

  // New method to update the user's status
  updateStatus(show, statusMessage) {
    const presence =  show === "offline" ? $pres({ type: "unavailable" }) : $pres()
      .c("show").t(show).up()        // The "show" element (e.g., "online", "away", "dnd")
      .c("status").t(statusMessage); // The "status" element (e.g., "Available", "Busy");

    this.connection.send(presence.tree());
    console.log(`Status updated to: ${show}, message: ${statusMessage}`);
  }

  // Other methods (sendMessage, signup, fetchRoster, etc.)
  
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

        const registerIQ = $iq({
          type: "set",
          to: this.domain,
        }).c("query", { xmlns: "jabber:iq:register" })
          .c("username").t(username).up()
          .c("password").t(password).up()
          .c("fullname").t(fullName).up()
          .c("email").t(email);

        this.connection.sendIQ(registerIQ, (iq) => {
          console.log("Registration successful", iq);
          this.connection.disconnect();
          onSuccess();
        }, (error) => {
          console.error("Registration failed", error);
          this.connection.disconnect();
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
        contacts[jid] = jid in this.roster ? this.roster[jid] : { jid, status: "offline", statusMessage:""}; 
        this.sendPresenceProbe(jid);
      }
      this.roster = contacts;
      this.onRosterReceived({ ...this.roster });
    });
  }

  handlePresence(presence) {
    console.log("Presence stanza received:", presence);

    const fullJid = presence.getAttribute("from");
    const from = Strophe.getBareJidFromJid(fullJid);
    const type = presence.getAttribute("type");

    let status = "";
    let statusMessage = "";

    if (type === "unavailable") {
      status = "offline";
      statusMessage = "";
    } else {
      status = presence.getElementsByTagName("show")[0]?.textContent || "online";
      statusMessage = presence.getElementsByTagName("status")[0]?.textContent || "Available";
    }

    this.roster[from] = { jid: from, status, statusMessage };
    this.onRosterReceived({ ...this.roster });

    return true;
  }

  sendPresenceProbe(jid) {
    const probe = $pres({ type: "probe", to: jid });
    this.connection.send(probe.tree());
  }
  
  cleanClientValues(){
    this.roster = {}; 
    this.onRosterReceived = () => {};
    this.jid = ""; 
  }

  disconnect() {
    this.connection.send($pres({ type: "unavailable" }).tree());
    this.connection.disconnect();
    console.log("Disconnected from XMPP server");
  }

  setOnRosterReceived(callback) {
    this.onRosterReceived = callback;
  }

  getProfile(jid, onProfileReceived) {
    const vCardIQ = $iq({ type: "get", to: jid })
      .c("vCard", { xmlns: "vcard-temp" });

    this.connection.sendIQ(vCardIQ, (iq) => {
      const vCard = iq.getElementsByTagName("vCard")[0];
      console.log(iq);
      if (vCard) {
        // const profile = {
        //   fullName: vCard.getElementsByTagName("FN")[0]?.textContent || "",
        //   nickname: vCard.getElementsByTagName("NICKNAME")[0]?.textContent || "",
        //   email: vCard.getElementsByTagName("EMAIL")[0]?.textContent || "",
        //   avatar: vCard.getElementsByTagName("PHOTO")[0]?.textContent || "", // Base64 encoded
        // };
        // onProfileReceived(profile);
      } else {
        console.log("vCard not found");
      }
    });
  }

  deleteAccount(onSuccess) {
    const deleteIQ = $iq({ type: "set", to: this.domain })
      .c("query", { xmlns: "jabber:iq:register" })
      .c("remove");

    this.connection.sendIQ(deleteIQ, (iq) => {
      console.log("Account deletion successful", iq);
      onSuccess();
    }, (error) => {
      console.error("Account deletion failed", error);
    });
  }

  addContact(jid, alias) {
    const addContactIQ = $iq({ type: "set" })
      .c("query", { xmlns: "jabber:iq:roster" })
      .c("item", { jid: jid, name: alias });

    this.connection.sendIQ(addContactIQ, (iq) => {
      console.log(`Contact ${jid} added successfully`, iq);
    }, (error) => {
      console.error(`Failed to add contact ${jid}`, error);
    });

    // Optionally, you can send a subscription request (presence)
    const presenceSubscribe = $pres({ to: jid, type: "subscribe" });
    this.connection.send(presenceSubscribe.tree());
  }
}
