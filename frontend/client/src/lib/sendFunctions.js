import socket from "./socket";

function sendStartGame(name) {
  socket.emit("startGame", name);
}

function sendAnswer(answer) {
  socket.emit("answer", answer);
}

export { sendStartGame, sendAnswer };
