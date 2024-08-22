import { Strophe, $pres, $msg, $iq } from "strophe.js";

export class XMPPClient {
  static PRESENCE_TYPES = {
    SUBSCRIBE: "subscribe",
    SUBSCRIBED: "subscribed",
    UNSUBSCRIBE: "unsubscribe",
    UNSUBSCRIBED: "unsubscribed",
    UNAVAILABLE: "unavailable",
  };

  constructor(url) {
    this.connection = new Strophe.Connection(url);

    this.domain = "alumchat.lol";
    this.roster = {}; 
    this.subscriptionQueue = [];
    this.jid = ""; 
    this.status = "online";
    this.statusMessage = "Available";
    this.onRosterReceived = () => {};
    this.onSubscriptionReceived = () => {}; 
  }

  connect(jid, password, onConnect) {
    // Ensure handlers are set up correctly before connection is established
    this.connection.addHandler(this.handlePresence.bind(this), null, "presence");

    this.connection.connect(jid, password, (status) => {
      if (status === Strophe.Status.CONNECTED) {
        this.jid = jid;
        this.sendPresence(this.status, this.statusMessage);
        onConnect();
      } else if (status === Strophe.Status.AUTHFAIL) {
        console.error("Authentication failed");
      }
    });
  }

  sendPresence(show, statusMessage) {
    const presence = show === "offline"
      ? $pres({ type: "unavailable" })
      : $pres().c("show").t(show).up().c("status").t(statusMessage);

    this.connection.send(presence.tree());
    console.log(`Status updated to: ${show}, message: ${statusMessage}`);

    this.status = show;
    this.statusMessage = statusMessage;
  }

  updateStatus(show, statusMessage) {
    this.sendPresence(show, statusMessage);
  }

  sendMessage(to, body) {
    const message = $msg({ to, type: "chat" }).c("body").t(body);
    this.connection.send(message.tree());
  }

  signup(username, fullName, email, password, onSuccess, onError) {
    this.connection.connect("car_21108@alumchat.lol", "prueba2024", (status) => {
      if (status === Strophe.Status.CONNECTED) {
        console.log("Connected to XMPP server");

        const registerIQ = $iq({ type: "set", to: this.domain })
          .c("query", { xmlns: "jabber:iq:register" })
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
    const rosterIQ = $iq({ type: "get" }).c("query", { xmlns: "jabber:iq:roster" });

    this.connection.sendIQ(rosterIQ, (iq) => {
      console.log("Roster received", iq);
      const contacts = {};
      const items = iq.getElementsByTagName("item");
      for (let i = 0; i < items.length; i++) {
        const jid = items[i].getAttribute("jid");
        if (items[i].getAttribute("subscription") === "both") {
          contacts[jid] = { jid, status: "online", statusMessage: "Available" };
        }
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

    if (this.jid !== from) {
      switch (type) {
        case XMPPClient.PRESENCE_TYPES.SUBSCRIBE:
          this.handleSubscriptionRequest(from);
          break;
        case XMPPClient.PRESENCE_TYPES.SUBSCRIBED:
          console.log(`${from} accepted your subscription request`);
          break;
        case XMPPClient.PRESENCE_TYPES.UNSUBSCRIBED:
          delete this.roster[from];
          break;
        case XMPPClient.PRESENCE_TYPES.UNAVAILABLE:
          this.roster[from] = { jid: from, status: "offline", statusMessage: "" };
          break;
        default:
          const status = presence.getElementsByTagName("show")[0]?.textContent || "online";
          const statusMessage = presence.getElementsByTagName("status")[0]?.textContent || "Available";
          this.roster[from] = { jid: from, status, statusMessage };
      }
      this.onRosterReceived({ ...this.roster });
    }

    return true;
  }

  handleSubscriptionRequest(from) {
    if (!(from in this.roster)) {
      console.log(`Subscription request from ${from} received`);
      this.subscriptionQueue.push(from);
      this.onSubscriptionReceived([...this.subscriptionQueue]);
    } else {
      console.log(`Subscription request from ${from} already accepted`);
      this.acceptSubscription(from);
    }
  }

  fetchSubscriptionRequests(onFetchSubscriptions) {
    onFetchSubscriptions([...this.subscriptionQueue]);
  }

  sendPresenceProbe(jid) {
    const probe = $pres({ type: "probe", to: jid });
    this.connection.send(probe.tree());
  }
  
  cleanClientValues() {
    this.roster = {};
    this.subscriptionQueue = [];
    this.onRosterReceived = () => {};
    this.onSubscriptionReceived = () => {};
    this.jid = "";
    this.status = "online";
    this.statusMessage = "Available";
  }

  disconnect() {
    this.sendPresence("offline", "Disconnected");
    this.connection.disconnect();
    this.cleanClientValues();
    console.log("Disconnected from XMPP server");
  }

  setOnRosterReceived(callback) {
    this.onRosterReceived = callback;
  }

  setOnSubscriptionReceived(callback) {
    this.onSubscriptionReceived = callback;
  }

  getProfile(jid, onProfileReceived) {
    const vCardIQ = $iq({ type: "get", to: jid }).c("vCard", { xmlns: "vcard-temp" });
    this.connection.sendIQ(vCardIQ, (iq) => {
      const vCard = iq.getElementsByTagName("vCard")[0];
      if (vCard) {
        console.log(iq);
        // process vCard here
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

  sendSubscriptionRequest(jid) {
    const presenceSubscribe = $pres({ to: jid, type: "subscribe" });
    this.connection.send(presenceSubscribe.tree());
    console.log(`Subscription request sent to ${jid}`);
  }

  addContact(jid) {
    const addContactIQ = $iq({ type: "set" })
      .c("query", { xmlns: "jabber:iq:roster" })
      .c("item", { jid });

    this.connection.sendIQ(addContactIQ, (iq) => {
      console.log(`Contact ${jid} added successfully`, iq);
    }, (error) => {
      console.error(`Failed to add contact ${jid}`, error);
    });
  }

  acceptSubscription(from) {
    console.log(`Accepting subscription request from ${from}`);
    const acceptPresence = $pres({ to: from, type: "subscribed" });
    this.connection.send(acceptPresence.tree());

    if (!(from in this.roster)) {
      console.log("Adding contact to roster");
      this.sendSubscriptionRequest(from);
    }

    this.subscriptionQueue = this.subscriptionQueue.filter(jid => jid !== from);
    this.onSubscriptionReceived([...this.subscriptionQueue]);
  }

  rejectSubscription(from) {
    console.log(`Rejecting subscription request from ${from}`);
    const rejectPresence = $pres({ to: from, type: "unsubscribed" });
    this.connection.send(rejectPresence.tree());
    
    this.subscriptionQueue = this.subscriptionQueue.filter(jid => jid !== from);
    this.onSubscriptionReceived([...this.subscriptionQueue]);
  }
}
