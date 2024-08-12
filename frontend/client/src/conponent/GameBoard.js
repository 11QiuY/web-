/*
游戏板块，管理游戏开始后的游戏界面
*/
import React, { useState, useEffect } from "react";
import GameStateBoard from "./GameBoardConponents/GameStateBoard";
import ChoiceButton from "./GameBoardConponents/ChoiceButton";
import socket from "../lib/socket";

const GameState = Object.freeze({
  WAITING: 0,
  CHOOSING: 1,
  END: 2
});
console.log(GameState);

const gamePlayer_temp = {
  name: "test",
  socketID: "123",
  score: 0,
  ready: false,
  dead: false,
  choice: "Stay or Leave"
};

const card_temp = {
  id: 0,
  type: "jewel / golden / trap",
  value: 0
};

const message_temp = {
  text: "message",
  source: "player / system"
};

console.log(card_temp);
console.log(gamePlayer_temp);
console.log(message_temp);

function GameBoard() {
  const [gameLevel, setGameLevel] = useState(0);

  useEffect(() => {
    socket.on("updateGameLevel", gameState => {
      setGameLevel(gameState);
    });
    socket.on("checkNewRoundStart", () => {
      socket.emit("NewRoundStart");
    });

    return () => {
      socket.off("updateGameLevel");
      socket.off("checkNewRoundStart");
    };
  }, []);

  return (
    <div className="flex flex-col items-center h-screen">
      <GameStateBoard />
      <ChoiceButton gameLevel={gameLevel} />
    </div>
  );
}

export default GameBoard;
