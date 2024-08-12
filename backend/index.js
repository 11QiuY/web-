const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const RoomsLogic = require("./roomsLogic");
const GameLogic = require("./gameLogic");
const { readFileSync } = require("fs");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

let cards;
try {
  const data = readFileSync("./cards.json", "utf8");
  cards = JSON.parse(data);
  console.log(cards);
} catch (err) {
  console.error("Error reading cards.json:", err);
  cards = null;
}

// 玩家对象的模板
let player_temp = {
  name: "test",
  socketID: "123",
  prepare: false,
  inviteCode: "" //用来标记这个玩家在哪个房间
};
// 房间对象的模板
let room_temp = {
  name: "test",
  persons: 1,
  players: [player_temp],
  start: false,
  gameState: {}
};
console.log(room_temp);

let players = []; // 所有玩家
let rooms = []; // 所有房间
let gameLogics = {};

// 处理断开链接
function onDisconnect(socket) {
  socket.on("disconnect", () => {
    const player = players.find(player => player.socketID === socket.id);
    const room = rooms.find(room => room.name === player.inviteCode);
    if (room) {
      room.persons--;
      room.players = room.players.filter(
        player => player.socketID !== socket.id
      ); // 离开房间
      if (room.persons === 0) {
        rooms.splice(rooms.indexOf(room), 1);
        if (gameLogics[room.name]) {
          delete gameLogics[room.name];
        } // 如果房间人数为0，删除房间
        console.log("玩家" + player.name + "退出了房间" + room.name);
      }
      io.emit("updateRooms", rooms);
      if (gameLogics[room.name]) {
        gameLogics[room.name].handleDisconnect(socket);
      }
    }
    socket.removeAllListeners();
    console.log("用户断开连接");
  });
}

// 处理进入游戏的玩家，在玩家列表中加入他
function onStartGame(socket) {
  socket.on("startGame", name => {
    console.log("socketID = " + socket.id + " name = " + name + " 进入了游戏");
    players.push({
      name,
      socketID: socket.id,
      prepare: false,
      inviteCode: ""
    });
  });
}

io.on("connection", socket => {
  console.log("新用户连接");
  onDisconnect(socket);
  onStartGame(socket);
  RoomsLogic(io, socket, rooms, players);

  socket.on("GameStart!", () => {
    console.log("Get GameStart!");
    const player = players.find(player => player.socketID === socket.id);
    const room = rooms.find(room => room.name === player.inviteCode);
    console.log("player: " + player.name + " start game in room " + room.name);
    let myGame = gameLogics[room.name];
    if (myGame) {
      myGame.addSocket(socket);
      if (myGame.canStart()) {
        console.log("start game in room " + room.name);
        myGame.start();
      }
    } else {
      console.log("create new gameLogic in room " + room.name);
      gameLogics[room.name] = new GameLogic(room, io, cards);
      gameLogics[room.name].addSocket(socket);
      if (gameLogics[room.name].canStart()) {
        console.log("start game in room " + room.name);
        gameLogics[room.name].start();
      }
    }
  });
  socket.on("checkGameOver", () => {
    const player = players.find(player => player.socketID === socket.id);
    const room = rooms.find(room => room.name === player.inviteCode);
    player.prepare = false;
    socket.leave(player.inviteCode);
    if (room) {
      if (gameLogics[room.name]) {
        delete gameLogics[room.name];
        console.log(gameLogics);
      }
      rooms.splice(rooms.indexOf(room), 1);
    }
    player.inviteCode = "";
    io.emit("updateRooms", rooms);
    console.log(rooms);
  });
});

server.listen(3001, () => {
  console.log("服务器正在运行在 http://localhost:3001");
});
