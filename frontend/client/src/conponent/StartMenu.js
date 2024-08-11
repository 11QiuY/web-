/*
游戏开始菜单，暂时用于输入玩家姓名
*/

import React, { useState } from "react";

function StartMenu({ OnStartGame }) {
  const [name, setName] = useState("");

  const handleInputChange = e => {
    setName(e.target.value);
  };

  const handleStartGame = () => {
    if (name.length > 0) {
      OnStartGame(name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen pt-24 bg-cover bg-center bg-[url('./img/bg1.jpg')]">
      <h1 className="text-4xl  rounded-xl text-white shadow-2xl p-2">印加宝藏</h1>
      <div className="flex flex-col items-center justify-center flex-auto">
        <input
          type="text"
          placeholder="Enter your name"
          onChange={handleInputChange}
          value={name}
          className="mb-4 p-2 border border-gray-300 rounded shadow-sm"
        />
        <button
          onClick={handleStartGame}
          className="p-2 bg-blue-500 text-white rounded-2xl shadow-md hover:bg-blue-600 size-2xl"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

export default StartMenu;
