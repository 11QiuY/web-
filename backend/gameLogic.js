class GameLogic {
  constructor(room, io, cards) {
    this.room = room;
    this.io = io;
    this.cards = cards;
    this.sockets = [];
    this.gameState = {
      round: 1,
      publicBonus: 0,
      restBonus: 0,
      goldenBonus: 0,
      dangers: [
        { id: 1, times: 0 },
        { id: 2, times: 0 },
        { id: 3, times: 0 },
        { id: 4, times: 0 },
        { id: 5, times: 0 }
      ],
      choices: [],
      restCards: [...cards],
      currentCard: {},
      players: room.players.map(player => {
        return {
          name: player.name,
          socketID: player.socketID,
          score: 0,
          status: "alive"
        };
      })
    };
    this.onDisconnectInit = () => {
      this.gameState.players = this.gameState.players.filter(
        player => player.socketID !== socket.id
      );
    };
  }

  addSocket(socket) {
    this.sockets.push(socket);
  }
  canStart() {
    console.log("房间人数" + this.room.players.length);
    console.log("已连接人数" + this.sockets.length);
    return this.sockets.length === this.room.players.length;
  }
  start() {
    console.log("游戏开始");
    this.initIo();
    this.initRound();
  }

  async initRound() {
    const room = this.room;
    const io = this.io;
    const gameState = this.gameState;

    io.to(room.name).emit("updateGameState", gameState);
    console.log(room.name + "开始新的一轮");
    io.to(room.name).emit("checkNewRoundStart");
    await this.waitForNewRoundStart();
    this.drawCard();
    this.drawCard();
    io.to(room.name).emit("updateGameState", gameState);
    if (this.checkRoundOver()) {
      this.newRound();
    } else {
      this.oneStep();
    }
  }

  async oneStep() {
    console.log(this.room.name + "开始一步");
    this.gameState.choices = [];
    this.io.to(this.room.name).emit("updateGameLevel", 1);
    await this.waitForChoices();
    this.io.to(this.room.name).emit("updateGameLevel", 0);
    this.processChoices(this.gameState.choices);
    this.drawCard();
    if (this.checkRoundOver()) {
      this.newRound();
    } else {
      this.io.to(this.room.name).emit("updateGameState", this.gameState);
      this.oneStep();
    }
  }

  processChoices(choices) {
    const gameState = this.gameState;
    console.log("处理选择");
    const leaver = choices.filter(choice => choice.choice === "leave");
    const leaveNum = leaver.length;
    if (leaveNum === 0) {
      return;
    } else if (leaveNum === 1) {
      gameState.players.forEach(player => {
        if (player.socketID === leaver[0].socketID) {
          player.status = "left";
          player.score += gameState.publicBonus;
          player.score += gameState.restBonus;
          player.score += gameState.goldenBonus;
          gameState.restBonus = 0;
          gameState.goldenBonus = 0;
        }
      });
    } else {
      gameState.players.forEach(player => {
        if (leaver.some(leave => leave.socketID === player.socketID)) {
          player.status = "left";
          player.score += gameState.publicBonus;
          player.score += Math.floor(gameState.restBonus / leaveNum);
          gameState.restBonus = gameState.restBonus % leaveNum;
        }
      });
    }
  }

  async waitForChoices() {
    const gameState = this.gameState;
    console.log("Waiting for choices");
    return new Promise(resolve => {
      for (const socket of this.sockets) {
        const onDisconnect = () => {
          this.gameState.choices = this.gameState.choices.filter(
            choice => choice.socketID !== socket.id
          );
          if (
            this.gameState.choices.length ===
            this.gameState.players.filter(player => player.status === "alive")
              .length
          ) {
            resolve();
            for (const socket of this.sockets) {
              socket.removeAllListeners("choice");
              socket.off("disconnect", onDisconnect);
            }
          }
        };

        socket.on("disconnect", onDisconnect);
        const onChoice = choice => {
          console.log(socket.id + "选择了" + choice);
          gameState.choices.push({ choice, socketID: socket.id });
          if (
            gameState.choices.length ===
            gameState.players.filter(player => player.status === "alive").length
          ) {
            resolve();
            for (const socket of this.sockets) {
              socket.removeAllListeners("choice");
              socket.off("disconnect", onDisconnect);
            }
          }
        };
        socket.on("choice", onChoice);
      }
    });
  }

  newRound() {
    const gameState = this.gameState;
    gameState.publicBonus = 0;
    gameState.restBonus = 0;
    gameState.goldenBonus = 0;
    gameState.dangers.forEach(danger => (danger.times = 0));
    gameState.choices = [];
    gameState.currentCard = {};
    gameState.restCards = [...this.cards];
    gameState.round++;
    gameState.players.forEach(player => {
      player.status = "alive";
    });
    if (this.checkGameOver()) {
      this.endGame();
    } else {
      this.initRound();
    }
  }

  endGame() {
    const room = this.room;
    const io = this.io;
    const gameState = this.gameState;
    const winner = gameState.players.reduce((prev, current) => {
      return prev.score > current.score ? prev : current;
    });
    this.cleanUpIo();
    io.to(room.name).emit("gameOver", winner);
  }

  drawCard() {
    const room = this.room;
    const gameState = this.gameState;
    const card =
      gameState.restCards[
        Math.floor(Math.random() * gameState.restCards.length)
      ];
    gameState.currentCard = card;
    console.log(room.name + "抽到了" + card.type + card.value);
    this.computeCardValue(card);
  }

  async waitForNewRoundStart() {
    const room = this.room;
    console.log("Waiting for new round start");
    return new Promise(resolve => {
      let readyPlayers = 0;
      const onNewRoundStart = () => {
        readyPlayers++;
        if (readyPlayers === room.players.length) {
          console.log("所有玩家准备好了");
          resolve();

          for (const socket of this.sockets) {
            socket.removeAllListeners("NewRoundStart");
          }
        }
      };
      for (const socket of this.sockets) {
        socket.on("NewRoundStart", onNewRoundStart);
      }
    });
  }

  computeCardValue(card) {
    const room = this.room;
    const gameState = this.gameState;
    switch (card.type) {
      case "jewel": {
        gameState.publicBonus += Math.floor(card.value / room.players.length);
        gameState.restBonus += card.value % room.players.length;
        break;
      }
      case "golden": {
        gameState.goldenBonus += card.value;
        break;
      }
      case "trap": {
        gameState.dangers[card.value - 1].times++;
        break;
      }
    }
  }

  checkRoundOver() {
    const gameState = this.gameState;
    const allLeave = gameState.players.every(
      player => player.status === "left"
    );
    return gameState.dangers.some(danger => danger.times >= 2) || allLeave;
  }
  checkGameOver() {
    const gameState = this.gameState;
    return gameState.round > 5 || gameState.players.length === 0;
  }
  initIo() {
    const gameState = this.gameState;
    console.log("初始化io");
    for (const socket of this.sockets) {
      socket.on("getGameState", cb => {
        console.log("socketID:" + socket.id, "getGameState");
        cb(gameState);
      });
      socket.on("disconnect", this.onDisconnectInit);
    }
  }
  cleanUpIo() {
    for (const socket of this.sockets) {
      socket.removeAllListeners("getGameState");
      socket.off("disconnect", this.onDisconnectInit);
    }
  }
}

module.exports = GameLogic;
