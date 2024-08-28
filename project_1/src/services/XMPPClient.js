import { Strophe, $pres, $msg, $iq } from "strophe.js"; // Import core Strophe.js library
import 'strophejs-plugin-muc'; // Import Multi-User Chat (MUC) plugin for group chat support
import { client, xml } from '@xmpp/client/browser'; // Import XMPP client for web
import debug from '@xmpp/debug'; // Import debug module for XMPP

// Define the XMPPClient class to manage XMPP functionalities
export class XMPPClient {
  // Define static constants for presence types (e.g., subscription states)
  static PRESENCE_TYPES = {
    SUBSCRIBE: "subscribe",
    SUBSCRIBED: "subscribed",
    UNSUBSCRIBE: "unsubscribe",
    UNSUBSCRIBED: "unsubscribed",
    UNAVAILABLE: "unavailable",
  };

  // Constructor initializes the connection, domain, and other state variables
  constructor(url) {
    this.connection = new Strophe.Connection(url); // Establish Strophe connection with the server

    this.domain = "alumchat.lol"; // Set the domain for XMPP services
    this.roster = {}; // Initialize roster for contacts
    this.subscriptionQueue = []; // Queue for pending subscription requests
    this.jid = ""; // Store the user's Jabber ID (JID)
    this.status = "online"; // Default status of the user
    this.statusMessage = "Available"; // Default status message
    this.groups = []; // Store the list of joined groups

    // Define callback functions for various XMPP events
    this.onRosterReceived = () => {};
    this.onSubscriptionReceived = () => {};
    this.onMessageReceived = () => {}; 
    this.onFileReceived = () => {};
    this.onGroupMessageReceived = () => {};
  }

  // Connect to the XMPP server with JID and password
  connect(jid, password, onConnect) {
    // Add handlers for presence and message stanzas
    this.connection.addHandler(this.handlePresence.bind(this), null, "presence");
    this.connection.addHandler(this.handleMessage.bind(this), null, "message", null, null, null);

    // Initiate connection with the server
    this.connection.connect(jid, password, (status) => {
      if (status === Strophe.Status.CONNECTED) {
        this.jid = jid; // Store the user's JID on successful connection
        this.sendPresence(this.status, this.statusMessage); // Send initial presence
        onConnect(); // Execute the onConnect callback
      } else if (status === Strophe.Status.AUTHFAIL) {
        console.error("Authentication failed");
      }
    });
  }

  // Send the user's presence status to the server
  sendPresence(show, statusMessage) {
    const presence = show === "offline"
      ? $pres({ type: "unavailable" }) // Send unavailable presence if offline
      : $pres().c("show").t(show).up().c("status").t(statusMessage); // Send status and message otherwise

    this.connection.send(presence.tree()); // Send the presence stanza
    console.log(`Status updated to: ${show}, message: ${statusMessage}`);

    this.status = show; // Update local status state
    this.statusMessage = statusMessage; // Update local status message state
  }

  // Update the user's status and send it to the server
  updateStatus(show, statusMessage) {
    this.sendPresence(show, statusMessage);
  }

  // Send a chat message to another user
  sendMessage(to, body) {
    const message = $msg({ to, type: "chat" }).c("body").t(body); // Create message stanza
    this.connection.send(message.tree()); // Send the message
    console.log(`Message sent to ${to}: ${body}`);
  }

  // Send a file to another user via base64 encoding
  sendFile(to, file) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1]; // Extract base64 data
      const fileName = file.name;

      // Create message stanza with file data and filename
      const message = $msg({ to, type: "chat" })
        .c("body").t(`File: ${fileName}`).up()
        .c("file").t(base64Data).up()
        .c("filename").t(fileName);

      this.connection.send(message.tree()); // Send the file message
      console.log(`File sent to ${to}: ${fileName}`);
    };
    reader.readAsDataURL(file); // Read the file as data URL
    this.onMessageReceived(to, this.jid, `File: ${file.name}`, new Date()); // Optimistically update chat
  }

  // Handle incoming messages (both direct and group messages)
  handleMessage(message) {
    const from = message.getAttribute("from"); // Get sender JID
    const to = message.getAttribute("to"); // Get recipient JID

    const forwarded = message.getElementsByTagName("forwarded")[0]; // Check if message is forwarded
    const fileElement = message.getElementsByTagName("file")[0]; // Check for file element
    const fileNameElement = message.getElementsByTagName("filename")[0]; // Check for filename element

    let body;
    let originalFrom;
    let originalTo;
    let timestamp;
  
    // If the message is forwarded, extract original sender, recipient, and timestamp
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
      timestamp = new Date(); // Set current time if no delay info
    }

    // If a file is included, process it and trigger onFileReceived callback
    if (fileElement && fileNameElement) {
      const base64Data = fileElement.textContent;
      const fileName = fileNameElement.textContent;
      const fileUrl = `data:application/octet-stream;base64,${base64Data}`;
      
      console.log(`File received from ${Strophe.getBareJidFromJid(originalFrom)} at ${timestamp.toLocaleDateString()}: ${fileName}`);
      this.onFileReceived(originalTo, Strophe.getBareJidFromJid(originalFrom), fileName, fileUrl, timestamp);
      return true;
    }

    const roomJid = Strophe.getBareJidFromJid(originalFrom); // Get room JID for group messages
    const isGroupMessage = roomJid.includes('@conference.');

    // If message body is present, handle accordingly
    if (body) {
      if (isGroupMessage) {
        // Handle group message
        const senderNickname = Strophe.getResourceFromJid(originalFrom); // Extract sender's nickname
        console.log(`Group message received in ${roomJid} from ${senderNickname} at ${timestamp.toLocaleDateString()}: ${body}`);
        const username = senderNickname.split("@")[0]; // Extract username
        this.onGroupMessageReceived(roomJid, senderNickname, username + ": " + body, timestamp);
      } else {
        // Handle direct message
        console.log(`Message received from ${Strophe.getBareJidFromJid(originalFrom)} at ${timestamp.toLocaleDateString()}: ${body}`);
        this.onMessageReceived(originalTo, Strophe.getBareJidFromJid(originalFrom), body, timestamp);
      }
    }
  
    return true; // Continue handling further messages
  }  

  // Set the callback for file reception
  setOnFileReceived(callback) {
    this.onFileReceived = callback;
  }

  // Fetch old messages using the XMPP MAM protocol
  fetchOldMessages() {
    const mamQueryIQ = $iq({ type: "set", id: "mam1" })
      .c("query", { xmlns: "urn:xmpp:mam:2" })
      .c("x", { xmlns: "jabber:x:data", type: "submit" })
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value").t("urn:xmpp:mam:2").up().up()
      .c("field", { var: "with" })
      .c("value").t(this.jid).up().up();

    this.connection.sendIQ(mamQueryIQ, null); // Send the MAM query
  }

  // Handle user signup using XMPP client
  signup(username, fullName, email, password, onSuccess) {
    try {
      const xmppClient = client({
        service: "ws://alumchat.lol:7070/ws", // XMPP WebSocket service
        resource: "", // Resource (optional)
        sasl: ['SCRAM-SHA-1', 'PLAIN'], // Preferred SASL mechanisms
      });

      // Return a promise to handle async signup
      return new Promise((resolve, reject) => {
        xmppClient.on("error", (err) => {
          if (err.code === "ECONERROR") {
            console.error("Connection error", err);
            xmppClient.stop();
            xmppClient.removeAllListeners();
            reject({ status: false, message: "Error in XMPP Client" });
          }
        });

        xmppClient.on("open", () => {
          console.log("Connection established");
          const iq = xml(
            "iq",
            { type: "set", to: "alumchat.lol", id: "register" },
            xml(
              "query",
              { xmlns: "jabber:iq:register" },
              xml("username", {}, username),
              xml("fullName", {}, fullName),
              xml("email", {}, email),
              xml("password", {}, password)
            )
          );
          xmppClient.send(iq); // Send registration request
        });
  
        xmppClient.on("stanza", async (stanza) => {
          if (stanza.is("iq") && stanza.getAttr("id") === "register") {
            await xmppClient.stop(); // Stop XMPP client after successful registration
            xmppClient.removeAllListeners(); // Clean up listeners
            onSuccess();

            if (stanza.getAttr("type") === "result") {
              resolve({ status: true, message: "Successful register" });

            } else if (stanza.getAttr("type") === "error") {
              console.log("Error in register", stanza);
              const error = stanza.getChild("error");

              if (error?.getChild("conflict")) {
                reject({ status: false, message: "User already in use" });
              }

              reject({ status: false, message: "An error occurred. Try again!" });
            }
          }
        });

        xmppClient.start().catch((err) => { 
          console.log(err);
        });
      });
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }

  // Fetch the user's roster (contact list)
  fetchRoster() {
    const rosterIQ = $iq({ type: "get" }).c("query", { xmlns: "jabber:iq:roster" });

    this.connection.sendIQ(rosterIQ, (iq) => {
      console.log("Roster received", iq);
      const contacts = {};
      const items = iq.getElementsByTagName("item");
      for (let i = 0; i < items.length; i++) {
        const jid = items[i].getAttribute("jid");
        if (items[i].getAttribute("subscription") === "both" || items[i].getAttribute("ask") === "subscription") {
          contacts[jid] = this.roster[jid] || { jid, status: "offline", statusMessage: "" };
          this.sendPresenceProbe(jid);
        }
      }
      this.roster = contacts; // Update local roster state
      this.onRosterReceived({ ...this.roster });
    });
  }

  // Handle presence updates from other users (e.g., online, offline)
  handlePresence(presence) {
    console.log("Presence stanza received:", presence);

    const fullJid = presence.getAttribute("from");
    const from = Strophe.getBareJidFromJid(fullJid);
    const type = presence.getAttribute("type");

    // Process different presence types
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

  // Handle incoming subscription requests from other users
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

  // Fetch pending subscription requests
  fetchSubscriptionRequests(onFetchSubscriptions) {
    onFetchSubscriptions([...this.subscriptionQueue]);
  }

  // Send a presence probe to check the status of a user
  sendPresenceProbe(jid) {
    const probe = $pres({ type: "probe", to: jid });
    this.connection.send(probe.tree());
  }
  
  // Reset client values on disconnect
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

  // Disconnect from the XMPP server
  disconnect() {
    this.sendPresence("offline", "Disconnected");
    this.connection.disconnect();
    this.cleanClientValues();
    console.log("Disconnected from XMPP server");
  }

  // Set callback for roster updates
  setOnRosterReceived(callback) {
    this.onRosterReceived = callback;
  }

  // Set callback for subscription updates
  setOnSubscriptionReceived(callback) {
    this.onSubscriptionReceived = callback;
  }

  // Set callback for incoming messages
  setOnMessageReceived(callback) {
    this.onMessageReceived = callback;
  }

  // Fetch a user's profile using vCard
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

  // Delete a user's account
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

  // Send a subscription request to another user
  sendSubscriptionRequest(jid) {
    const presenceSubscribe = $pres({ to: jid, type: "subscribe" });
    this.connection.send(presenceSubscribe.tree());
    console.log(`Subscription request sent to ${jid}`);
  }

  // Add a new contact to the user's roster
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

  // Accept a subscription request from another user
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

  // Reject a subscription request from another user
  rejectSubscription(from) {
    console.log(`Rejecting subscription request from ${from}`);
    const rejectPresence = $pres({ to: from, type: "unsubscribed" });
    this.connection.send(rejectPresence.tree());
    
    this.subscriptionQueue = this.subscriptionQueue.filter(jid => jid !== from);
    this.onSubscriptionReceived([...this.subscriptionQueue]);
  }

  // Invite a user to a group chat
  inviteUserToGroup(groupJid, userJid, reason = "") {
    const inviteMessage = $msg({ to: groupJid, from: this.jid })
      .c("x", { xmlns: "http://jabber.org/protocol/muc#user" })
      .c("invite", { to: userJid })
      .c("reason").t(reason).up().up();

    this.connection.send(inviteMessage.tree());
    console.log(`Invitation sent to ${userJid} for group ${groupJid}`);
  }

  // Join an existing group chat
  joinGroup(groupName, nickname, onSuccess) {
    const roomJid = `${groupName}@conference.${this.domain}`;
    const presence = $pres({
      to: `${roomJid}/${nickname}`
    }).c("x", { xmlns: "http://jabber.org/protocol/muc" });

    console.log("Joining room:", roomJid);

    this.connection.send(presence.tree(), () => {
      console.log(`Joined room: ${roomJid}`);
      //onSuccess(roomJid);
    }, (err) => {
      console.error(`Failed to join room: ${roomJid}`, err);
    });
  }

  // Create a new group chat
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
        //onSuccess(roomJid);
      }, (error) => {
        console.error("Error creating room:", error)
      })
    }, 500);
  }

  // Send a message to a group chat
  sendMessageToGroup(groupJid, message) {
    const msg = $msg({ to: groupJid, type: "groupchat" })
      .c("body").t(message);
    this.connection.send(msg.tree());
    console.log(`Message sent to group ${groupJid}: ${message}`);
  }

  // Leave a group chat
  leaveGroup(groupJid, nickname) {
    const roomJid = `${groupJid}@conference.${this.domain}/${nickname}`;
    this.connection.muc.leave(roomJid, nickname, () => {
      console.log(`Left the group ${groupJid}`);
    });
  }

  // Fetch all available rooms on the server
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

  // Fetch the rooms that the user has joined
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

  // Set callback for group messages
  setOnGroupMessageReceived(callback) {
    this.onGroupMessageReceived = callback;
  }
}
