import React, { useEffect, useState } from "react";
import socket from "../../lib/socket";

function ChoiceButton({ gameLevel }) {
  const [choice, setChoice] = useState(null);
  const [status, setStatus] = useState("alive");

  useEffect(() => {
    socket.on("updateGameLevel", Level => {
      if (Level === 0) {
        setChoice(null);
      }
    });
    socket.on("updateGameState", gameState => {
      const Pstatus = gameState.players.find(
        player => player.socketID === socket.id
      ).status;
      setStatus(Pstatus);
    });

    return () => {
      socket.off("updateGameLevel");
    };
  });

  const handleStay = () => {
    if (gameLevel === 1 && !choice && status === "alive" /* CHOOSING */) {
      socket.emit("choice", "stay");
      setChoice("stay");
    }
  };

  const handleLeave = () => {
    if (gameLevel === 1 && !choice && status === "alive" /* CHOOSING */) {
      socket.emit("choice", "leave");
      setChoice("leave");
    }
  };
  return (
    <div className="space-x-3">
      <button onClick={handleStay}>Stay</button>
      <button onClick={handleLeave}>Leave</button>
    </div>
  );
}

export default ChoiceButton;
