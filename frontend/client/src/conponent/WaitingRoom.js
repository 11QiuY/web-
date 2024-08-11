/*
等待开始游戏时的板块，包括房间列表、进入房间、创建房间等功能
在房间中可以看到房间内的玩家列表，可以准备、取消准备、退出房间
所有人都准备好后会播放倒计时动画随后进入游戏
*/

import React, { useState, useEffect, useRef } from "react";
import socket from "../lib/socket";

function WaitingRoom() {
  const [rooms, setRooms] = useState([]); // 大厅中所有房间的列表，用于渲染房间列表
  const [currentRoom, setCurrentRoom] = useState(null); // 当前玩家所在的房间，用于渲染房间内的玩家列表
  const [inviteCode, setInviteCode] = useState(""); // 玩家输入的邀请码，用于进入或创建房间
  const [prepare, setPrepare] = useState(false); // 玩家是否准备，用于准备或取消准备

  const inputRef = useRef(null); // 用于获取输入框的引用，使得输入邀请码时能自动聚焦

  // 设置钩子函数，监听socket事件
  useEffect(
    () => {
      socket.emit("getRooms", rooms => {
        setRooms(rooms);
      });
      socket.on("updateRooms", rooms => {
        setRooms(rooms);
        if (currentRoom)
          setCurrentRoom(rooms.find(room => room.name === currentRoom.name));
      });

      return () => {
        socket.off("updateRooms");
      };
    },
    [currentRoom]
  );

  // input聚焦问题
  useEffect(
    () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [inviteCode]
  );

  // 房间列表
  function RoomsBoard() {
    return (
      <div className="flex flex-col items-center justify-center h-3/4">
        <div className="w-1/2 h-2/3 border border-gray-300 rounded-lg shadow-lg flex flex-col items-center">
          <h2 className="text-3xl">Rooms</h2>
          <ul className="w-full h-full overflow-y-auto">
            {rooms.map(room =>
              <li key={room.name} className="mb-4 p-2">
                <span className="border border-gray-300 rounded-lg shadow-lg">
                  {room.name} , {room.persons}/8
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // 处理退出房间的函数，首先取消准备，然后向服务器发送退出房间的请求，最后将当前房间设置为null
  const handleExit = () => {
    setPrepare(false);
    socket.emit("exitRoom", currentRoom.name);
    setCurrentRoom(null);
  };

  // 处理准备或取消准备的函数，向服务器发送当前准备状态，然后设置准备状态
  const handlePrepare = () => {
    socket.emit("prepare", !prepare, currentRoom.name, res => {
      setCurrentRoom(res);
    });
    setPrepare(!prepare);
  };

  // 房间内部板块，渲染房间名，玩家列表，退出房间按钮，准备按钮以及倒计时
  function Room() {
    return (
      <div className="flex flex-col items-center h-screen space-y-2">
        <div className="w-1/2 h-2/3 border border-gray-300 rounded-lg shadow-lg flex flex-col items-center">
          <h2 className="text-3xl">
            房间名：{currentRoom.name}
          </h2>
          <ul className="w-full h-full overflow-y-auto">
            {currentRoom.players.map(player =>
              <li key={player.name} className="mb-4 p-2">
                <span className="border border-gray-300 rounded-lg shadow-lg size-2xl">
                  玩家：{player.name} {player.prepare ? "已准备" : "未准备"}
                </span>
              </li>
            )}
          </ul>
        </div>
        <div className="space-x-10">
          <button
            onClick={handleExit}
            className="bg-blue-500 text-white rounded-lg shadow-lg p-2 text-xl"
          >
            Exit
          </button>
          <button
            onClick={handlePrepare}
            className="bg-blue-500 text-white rounded-lg shadow-lg p-2 text-xl"
          >
            {prepare ? "DisPrepare" : "Prepare"}
          </button>
        </div>
      </div>
    );
  }

  const handleEnterInviteCode = e => {
    setInviteCode(e.target.value);
  };

  // 处理进入房间的函数，首先判断邀请码是否为空，然后向服务器发送进入房间的请求，最后设置当前房间
  const handleEnter = () => {
    if (inviteCode.length <= 0) {
      alert("Please enter the invite code");
      return;
    } else {
      socket.emit("enterRoom", inviteCode, res => {
        if (res) {
          // res为后端发来的房间信息，房间不可进入则返回null
          setCurrentRoom(res);
        } else {
          alert("Room not found");
        }
      });
      setInviteCode("");
    }
  };

  // 处理创建房间的函数，首先判断邀请码是否为空，然后向服务器发送创建房间的请求，最后设置当前房间
  const handleCreate = () => {
    if (inviteCode.length <= 0) {
      alert("Please enter the invite code");
      return;
    } else {
      socket.emit("createRoom", inviteCode, res => {
        if (res) {
          setCurrentRoom(res);
        } else {
          alert("the room has been created");
        }
      });
      setInviteCode("");
    }
  };

  // 进入或创建房间板块，包括输入邀请码，进入房间按钮，创建房间按钮
  function EnterOrCreateRoom() {
    return (
      <div className="flex flex-col items-center justify-cente">
        <div className="flex flex-col items-center space-y-4">
          <input
            type="text"
            placeholder="Enter the invite code"
            onChange={handleEnterInviteCode}
            value={inviteCode}
            ref={inputRef}
            className="border border-gray-300 rounded-lg shadow-lg text-lg w-64 p-2"
          />
          <div className="flex space-x-10">
            <button
              onClick={handleEnter}
              className="bg-blue-500 text-white rounded-lg shadow-lg p-2 text-xl"
            >
              Enter
            </button>
            <button
              onClick={handleCreate}
              className="bg-blue-500 text-white rounded-lg shadow-lg p-2 text-xl"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {currentRoom
        ? <Room />
        : <div className="flex flex-col h-screen">
            <RoomsBoard />
            <EnterOrCreateRoom />
          </div>}
    </div>
  );
}

export default WaitingRoom;
