const io = require("socket.io")(8900, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const axios = require("axios")

let users = [];
 




const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  //when connect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  

  //send and get message
socket.on("sendMessage", ({ senderId, receiverId, text }) => {
  
  const user = getUser(receiverId);
  if (user && user.socketId) {
    // Send message to receiver if they are online and socketId is known
    io.to(user.socketId).emit("getMessage", {
      senderId,
      text,
    });
  } else {
    // Log an error or handle the case where the receiver is not connected
    console.log(`User with id ${receiverId} is not online.`);
  }
});

// seen

socket.on("markMessagesAsSeen", async ({ conversationId, receiver_Id, seen }) => {
  try {
      
    const res = await axios.put(
      `http://localhost:8800/api/messages/`, // Assuming you need a specific endpoint
      { conversationId , seen}
    );
    
    console.log("SEENER:", receiver_Id)
    const user = getUser(receiver_Id); // Correctly find the user to emit the event
    if(user){
    io.to(user.socketId).emit("messagesSeen", { conversationId });
    }

  } catch (err) {
    console.error(err);
  }
});
		// try {
		// 	await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
		// 	await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
		// 	io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
		// } catch (error) {
		// 	console.log(error);
		// }


  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
