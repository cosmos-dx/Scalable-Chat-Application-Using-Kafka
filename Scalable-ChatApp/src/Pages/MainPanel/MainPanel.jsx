import React, { useContext, useEffect, useState } from "react";
import { ChatContext } from "../../Context/ChatContext";
import "./MainPanel.css";
import io from "socket.io-client";

const MainPanel = () => {
  const { api } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState("");
  const [totalmessages, setTotalmessages] = useState({ "group-chat": [] });
  const [currentUser, setCurrentUser] = useState("group-chat");
  useEffect(() => {
    const newSocket = io(api);
    setSocket(newSocket);
    newSocket.on("message", handleReceivedMessage);
    newSocket.on("privateMessage",handleReceivedMessagePrivate );
    newSocket.on("connect", () => {
      setUserId(newSocket.id);
    });
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [api]);

  const handleReceivedMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
    setTotalmessages((prevTotalMessages) => ({
      ...prevTotalMessages,
      "group-chat": [...(prevTotalMessages["group-chat"] || []), message],
    }));
  };
  const handleReceivedMessagePrivate = (message) =>{
    
    setTotalmessages((prevTotalMessages) => ({
      ...prevTotalMessages,
      [message.senderId]: [...(prevTotalMessages[message.senderId] || []), message],
    }));
  }

  const sendMessage = () => {
    if(currentUser !== 'group-chat'){
      setTotalmessages((prevTotalMessages) => ({
        ...prevTotalMessages,
        [currentUser]: [
          ...(prevTotalMessages[currentUser] || []),
          { senderId: "You", content: newMessage }
        ],
      }));
      
    }
    if (newMessage.trim() !== "" && socket) {
      const message = { senderId: userId, content: newMessage, receiverId: currentUser };
      currentUser === 'group-chat' ? socket.emit("message", message) : socket.emit("privateMessage", message);
      setNewMessage("");
    }
  };

  const addChatUser = () => {
    const receiverSocket = prompt("Enter receiver's socket:");
    if (receiverSocket) {
      setTotalmessages((prevTotalMessages) => ({
        ...prevTotalMessages,
        [receiverSocket]: [],
      }));
    }
  };

  return (
    <div className="mainpanel-container">
      <div className="chat-window">
        <div className="msg-lists">
          {Object.keys(totalmessages).map((user, index) => (
            <div
              key={index}
              className={`chat-user ${
                currentUser === user ? "active-user" : ""
              }`}
              onClick={() => setCurrentUser(user)}
            >
              {user}

            </div>
            
          ))}
            <button onClick={addChatUser}>Chat new User +</button>
        </div>
        <div className="msg-window">
          <div className="header">
            <h2>{userId}</h2>
          </div>
          <div className="messages-in-window">
            {totalmessages[currentUser] &&
              totalmessages[currentUser]
                .map((message, index) => (
                  <div key={index} className="message">
                    <span className="sender">
                      {message.senderId === userId ? "You" : message.senderId}:
                    </span>{" "}
                    <span className="content">{message.content}</span>
                  </div>
                ))
                .reverse()}
          </div>

          <div className="input-container">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPanel;
