function RoomsLogic(io, socket, rooms, players) {
  function onGetRooms(socket) {
    socket.on("getRooms", cb => {
      cb(rooms);
    });
  }

  function onCreateRoom(socket) {
    socket.on("createRoom", (inviteCode, cb) => {
      console.log("createRoom");
      console.log("before:", rooms);
      let flag = false;
      rooms.forEach(room => {
        if (room.name === inviteCode) {
          cb(null);
          flag = true;
        }
      });
      if (!flag) {
        const player = players.find(player => player.socketID === socket.id);
        player.inviteCode = inviteCode;
        const room = { name: inviteCode, persons: 1, players: [player] };
        rooms.push(room);
        socket.join(inviteCode);
        cb(room);
        console.log("玩家" + player.name + "创建了房间" + room.name);
        io.emit("updateRooms", rooms);
      }
      console.log("after:", rooms);
    });
  }

  function onEnterRoom(socket) {
    socket.on("enterRoom", (inviteCode, cb) => {
      flag = false;
      const room = rooms.find(room => room.name === inviteCode);
      if (!room || room.persons === 8 || room.start) {
        cb(null);
        flag = true;
      }
      if (!flag) {
        const player = players.find(player => player.socketID === socket.id);
        player.inviteCode = inviteCode;
        room.persons++;
        room.players.push(player);
        socket.join(inviteCode);
        cb(room);
        console.log("玩家" + player.name + "进入了房间" + room.name);
        io.emit("updateRooms", rooms);
      }
    });
  }

  function onExitRoom(socket) {
    socket.on("exitRoom", inviteCode => {
      const room = rooms.find(room => room.name === inviteCode);
      if (!room) {
        return;
      }
      const player = players.find(player => player.socketID === socket.id);
      player.inviteCode = "";
      room.persons--;
      room.players = room.players.filter(
        player => player.socketID !== socket.id
      );

      if (room.persons === 0) {
        rooms = rooms.filter(room => room.name !== inviteCode);
      }
      socket.leave(inviteCode);
      console.log("玩家" + player.name + "退出了房间" + room.name);
      io.emit("updateRooms", rooms);
    });
  }

  function onPrepare(socket) {
    socket.on("prepare", (prepare, inviteCode, cb) => {
      const room = rooms.find(room => room.name === inviteCode);
      const player = room.players.find(player => player.socketID === socket.id);
      player.prepare = prepare;
      console.log(prepare);
      if (prepare) {
        console.log("玩家" + player.name + "准备了");
      } else {
        console.log("玩家" + player.name + "取消了准备");
      }
      cb(room);
      io.to(inviteCode).emit("updateRooms", rooms);

      const allPrepared = room.players.every(player => player.prepare);
      if (allPrepared) {
        room.start = true;
        io.to(inviteCode).emit("startGame");
      }
    });
  }

  onGetRooms(socket);
  onCreateRoom(socket);
  onEnterRoom(socket);
  onExitRoom(socket);
  onPrepare(socket);
}

module.exports = RoomsLogic;
