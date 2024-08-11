import React, { useState, useEffect } from "react";
import socket from "../../lib/socket";

function MessageBoard() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("message", message => {
      setMessages(messages => [...messages, message]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  function parseMessage(message) {
    const source = message.type;
    if (source === "system") {
      return (
        <span>
          System: {message.text}
        </span>
      );
    } else {
      return (
        <span>
          {message.source}: {message.text}
        </span>
      );
    }
  }

  return (
    <div>
      <h2>Messages</h2>
      <ul>
        {messages.map(message => {
          return parseMessage(message);
        })}
      </ul>
    </div>
  );
}

export default MessageBoard;
