import { Strophe, $pres, $msg, $iq } from "strophe.js";
import 'strophejs-plugin-muc';

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
    this.groups = [];

    this.onRosterReceived = () => {};
    this.onSubscriptionReceived = () => {};
    this.onMessageReceived = () => {}; 
    this.onFileReceived = () => {};
    this.onGroupMessageReceived = () => {};
  }

  connect(jid, password, onConnect) {
    this.connection.addHandler(this.handlePresence.bind(this), null, "presence");
    this.connection.addHandler(this.handleMessage.bind(this), null, "message", null, null, null);

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
    console.log(`Message sent to ${to}: ${body}`);
  }

  sendFile(to, file) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      const fileName = file.name;

      const message = $msg({ to, type: "chat" })
        .c("body").t(`File: ${fileName}`).up()
        .c("file").t(base64Data).up()
        .c("filename").t(fileName);

      this.connection.send(message.tree());
      console.log(`File sent to ${to}: ${fileName}`);
    };
    reader.readAsDataURL(file);
    this.onMessageReceived(to, this.jid, `File: ${file.name}`, new Date());
  }

  handleMessage(message) {
    const from = message.getAttribute("from");
    const to = message.getAttribute("to");

    const forwarded = message.getElementsByTagName("forwarded")[0];
    const fileElement = message.getElementsByTagName("file")[0];
    const fileNameElement = message.getElementsByTagName("filename")[0];

    let body;
    let originalFrom;
    let originalTo;
    let timestamp;
  
    if (forwarded) {
      const forwardedMessage = forwarded.getElementsByTagName("message")[0];
      originalFrom = forwardedMessage.getAttribute("from");
      originalTo = forwardedMessage.getAttribute("to");
      body = forwardedMessage.getElementsByTagName("body")[0]?.textContent;
  
      const delay = forwarded.getElementsByTagName("delay")[0];
      if (delay) {
        timestamp = new Date(delay.getAttribute("stamp"));
      }

    } else {
      originalFrom = from;
      originalTo = to;
      body = message.getElementsByTagName("body")[0]?.textContent;
  
      timestamp = new Date();
    }

    if (fileElement && fileNameElement) {
      const base64Data = fileElement.textContent;
      const fileName = fileNameElement.textContent;
      const fileUrl = `data:application/octet-stream;base64,${base64Data}`;
      
      console.log(`File received from ${Strophe.getBareJidFromJid(originalFrom)} at ${timestamp.toLocaleDateString()}: ${fileName}`);
      this.onFileReceived(originalTo, Strophe.getBareJidFromJid(originalFrom), fileName, fileUrl, timestamp);
      return true;
    }

    const roomJid = Strophe.getBareJidFromJid(originalFrom); // Get room JID if it's a group message
    const isGroupMessage = roomJid.includes('@conference.');
  
    if (body) {
      if (isGroupMessage) {
          // Handle group message
          console.log(originalFrom);
          const senderNickname = Strophe.getResourceFromJid(originalFrom); // Get the nickname of the sender
          console.log(`Group message received in ${roomJid} from ${senderNickname} at ${timestamp.toLocaleDateString()}: ${body}`);
          const username = senderNickname.split("@")[0];
          this.onGroupMessageReceived(roomJid, senderNickname, username+": "+body, timestamp);
      } else {
          // Handle direct message
          console.log(`Message received from ${Strophe.getBareJidFromJid(originalFrom)} at ${timestamp.toLocaleDateString()}: ${body}`);
          this.onMessageReceived(originalTo, Strophe.getBareJidFromJid(originalFrom), body, timestamp);
      }
    }
  
    return true;
  }  

  setOnFileReceived(callback) {
    this.onFileReceived = callback;
  }

  fetchOldMessages() {
    const mamQueryIQ = $iq({ type: "set", id: "mam1" })
      .c("query", { xmlns: "urn:xmpp:mam:2" })
      .c("x", { xmlns: "jabber:x:data", type: "submit" })
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value").t("urn:xmpp:mam:2").up().up()
      .c("field", { var: "with" })
      .c("value").t(this.jid).up().up();

    this.connection.sendIQ(mamQueryIQ, null);
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
        if (items[i].getAttribute("subscription") === "both" || items[i].getAttribute("ask") === "subscription" ) {
          contacts[jid] = this.roster[jid] || { jid, status: "offline", statusMessage: "" }; 
          this.sendPresenceProbe(jid);
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
    this.onMessageReceived = () => {};

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

  setOnMessageReceived(callback) {
    this.onMessageReceived = callback;
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

  inviteUserToGroup(groupJid, userJid, reason = "") {
    const inviteMessage = $msg({ to: groupJid, from: this.jid })
      .c("x", { xmlns: "http://jabber.org/protocol/muc#user" })
      .c("invite", { to: userJid })
      .c("reason").t(reason).up().up();

    this.connection.send(inviteMessage.tree());
    console.log(`Invitation sent to ${userJid} for group ${groupJid}`);
  }

  joinGroup(groupName, nickname, onSuccess) {
    const roomJid = `${groupName}@conference.${this.domain}`;
    const presence = $pres({
        to: `${roomJid}/${nickname}`
    }).c("x", { xmlns: "http://jabber.org/protocol/muc" });

    this.connection.send(presence.tree(), () => {
        console.log(`Joined room: ${roomJid}`);
        onSuccess(roomJid);
    }, (err) => {
        console.error(`Failed to join room: ${roomJid}`, err);
    });
  }

  createGroup(groupName, nickname, onSuccess) {
    const roomJid = `${groupName}@conference.${this.domain}`;

    const presence = $pres({
      to: `${roomJid}/${nickname}`
    }).c("x", { xmlns: "http://jabber.org/protocol/muc" });

    this.connection.send(presence.tree())

    setTimeout(() => {
      const createIQ = $iq({ type: "set", to: roomJid })
        .c("query", { xmlns: "http://jabber.org/protocol/muc#owner" })
        .c("x", { xmlns: "jabber:x:data", type: "submit" })
        .c("field", { var: "FORM_TYPE" })
        .c("value").t("http://jabber.org/protocol/muc#roomconfig").up().up()
        .c("field", { var: "muc#roomconfig_persistentroom" })
        .c("value").t("1").up().up()
        .c("field", { var: "muc#roomconfig_membersonly" })
        .c("value").t("0").up().up()
        .c("field", { var: "muc#roomconfig_allowinvites" })
        .c("value").t("1").up().up()
        .c("field", { var: "muc#roomconfig_publicroom" })
        .c("value").t("1").up().up()

      this.connection.sendIQ(createIQ, (iq) => {
        console.log("Room created successfully:", roomJid)
        onSuccess(roomJid);
      }, (error) => {
        console.error("Error creating room:", error)
      })
    }, 500)
  }

  sendMessageToGroup(groupJid, message) {
    const msg = $msg({ to: groupJid, type: "groupchat" })
      .c("body").t(message);
    this.connection.send(msg.tree());
    console.log(`Message sent to group ${groupJid}: ${message}`);
  }

  leaveGroup(groupJid, nickname) {
    const roomJid = `${groupJid}@conference.${this.domain}/${nickname}`;
    this.connection.muc.leave(roomJid, nickname, () => {
      console.log(`Left the group ${groupJid}`);
    });
  }

  fetchAllRooms() {
    const mucService = `conference.${this.domain}`;
    const discoItemsIQ = $iq({ type: "get", to: mucService })
        .c("query", { xmlns: "http://jabber.org/protocol/disco#items" });

    this.connection.sendIQ(discoItemsIQ, (iq) => {
        const items = iq.getElementsByTagName("item");
        const rooms = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const roomJid = item.getAttribute("jid");
            const roomName = item.getAttribute("name");
            rooms.push({ jid: roomJid, name: roomName });
        }

        console.log("All rooms:", rooms);
    });
  }

  fetchJoinedRooms(onSuccess) {
    const bookmarksIQ = $iq({ type: "get" })
        .c("query", { xmlns: "jabber:iq:private" })
        .c("storage", { xmlns: "storage:bookmarks" });

    this.connection.sendIQ(bookmarksIQ, (iq) => {
      console.log("Bookmarks received:", iq);
        const storage = iq.getElementsByTagName("storage")[0];
        if (!storage) {
            console.error("No bookmarks found");
            onError(new Error("No bookmarks found"));
            return;
        }

        const roomNodes = storage.getElementsByTagName("conference");
        const rooms = [];
        for (let i = 0; i < roomNodes.length; i++) {
            const roomNode = roomNodes[i];
            const roomJid = roomNode.getAttribute("jid");
            const roomName = roomNode.getAttribute("name");
            rooms.push({ jid: roomJid, name: roomName });
        }

        onSuccess(rooms);
    });
  }

  setOnGroupMessageReceived(callback) {
    this.onGroupMessageReceived = callback;
  }
}
