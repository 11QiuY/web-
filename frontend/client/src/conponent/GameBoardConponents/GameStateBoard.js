import React, { useEffect, useState } from "react";
import socket from "../../lib/socket";

function GameStateBoard() {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on("updateGameState", gameState => {
      setGameState(gameState);
    });

    socket.emit("getGameState", state => {
      setGameState(state);
    });

    return () => {
      socket.off("updateGameState");
    };
  }, []);

  if (!gameState) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <h2>
        Round : {gameState.round}
      </h2>
      <h2>
        Public Bonus : {gameState.publicBonus} , Rest Bonus :
        {gameState.restBonus} , Golden Bonus:{gameState.goldenBonus}
      </h2>
      <h2 className="space-x-4">
        Dangers:
        {gameState.dangers.map(danger => {
          return (
            <span key={danger.name}>
              {danger.id} * {danger.times}
            </span>
          );
        })}
      </h2>
      <div>
        <h2>
          CurrenCard'type : {gameState.currentCard.type} , CurrenCard'value:{gameState.currentCard.value}
        </h2>
        <ul>
          {gameState.players.map(player => {
            return (
              <li key={player.name}>
                {player.name} : {player.score}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default GameStateBoard;
