import StartMenu from "./conponent/StartMenu";
import React, { useState, useEffect } from "react";
import socket from "./lib/socket";
import { sendStartGame } from "./lib/sendFunctions";
import WaitingRoom from "./conponent/WaitingRoom";
import GameBoard from "./conponent/GameBoard";

function App() {
  const [started, setStarted] = useState(false); // 是否进入游戏界面
  const [playGame, setPlayGame] = useState(false); // 是否开始游戏逻辑

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected to server");
    });

    socket.on("startGame", () => {
      setPlayGame(true);
    });

    socket.on("gameOver", () => {
      setPlayGame(false);
      socket.emit("checkGameOver");
    });

    return () => {
      socket.off("connect");
      socket.off("startGame");
      socket.off("gameOver");
    };
  }, []);

  // 进入游戏界面，在后端登记玩家姓名
  const handleStartGame = name => {
    setStarted(true);
    sendStartGame(name);
  };

  return (
    <div>
      {!playGame
        ? <div>
            {!started
              ? <StartMenu OnStartGame={handleStartGame} />
              : <div>
                  <WaitingRoom />
                </div>}
          </div>
        : <div>
            <GameBoard />
          </div>}
    </div>
  );
}

export default App;
