var socketIo = require("socket.io");
var io = socketIo();

// // Require module
// const adminStartTimer = require("./sockets/adminSendStartTimer");
// const adminSendLevelUp = require("./sockets/adminSendLevelUp");
// const adminSendShowAnswer = require("./sockets/adminSendShowAnswer");
// const adminSendShowHelp = require("./sockets/adminSendShowHelp");
// const adminSendShowOption = require("./sockets/adminSendShowOption");
// const userSendOption = require("./sockets/userSendOption");
// const adminSendCheckResult = require("./sockets/adminSendCheckResult");
// const adminSendRefreshInfo = require("./sockets/adminSendRefreshInfo");
// const adminSendShowCover = require("./sockets/adminSendShowCover");
// const adminSendHideCover = require("./sockets/adminSendHideCover");
// const adminSendShowAnswerFlippicture = require("./sockets/adminSendShowAnswerFlipPicture");
// const adminSendHideAnswerFlippicture = require("./sockets/adminSendHideAnswerFlipPicture");

var socketApi = { io };
var connectedUsers = [];
// // Server listen and action here
// adminStartTimer(io);
// adminSendLevelUp(io);
// adminSendShowAnswer(io);
// adminSendShowHelp(io);
// adminSendShowOption(io);
// userSendOption(io);
// adminSendCheckResult(io);
// adminSendRefreshInfo(io);
// adminSendShowCover(io);
// adminSendHideCover(io);
// adminSendShowAnswerFlippicture(io);
// adminSendHideAnswerFlippicture(io);
const getSocket = (userID, array) => {
  for (var i = 0; i < array.length; i++) {
    if (array[i].id === userID) {
      return array[i].socket;

    }
  }
}
var clientSocket;

io.on('connection', function (socket) {
  let users = {
    id: socket.id,
    socket: socket
  }

  console.log('A user connected: ' + socket.id);
  console.log('same '+users.id);
  console.log('before emit '+socket.id);
  console.log('same same '+users.id);
  socket.emit('send-id', socket.id);
  connectedUsers.push(users);
});

module.exports = {
  socketApi,
  sendCurrentIP: (socketID, ip) => {
    console.log('sending ip ...')
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit("server-send-current-ip", ip)
  },
  sendCurrentUserAgent: (socketID, data) => {
    console.log("TCL: socketID", socketID)
    console.log('sending user agent')
    let userSocket = getSocket(socketID, connectedUsers);
    //console.log("TCL: userSocket", userSocket)
    userSocket.emit('server-send-current-useragent', data)
  },
  sendCurrentURL: (socketID, url) => {
    console.log("sending url...");
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit(`server-send-current-url`, url)
  },
  sendNotFoundURL: (socketID) => {
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('not found url')
  },
  sendInvalidQuery: (socketID) => {
		console.log("TCL: socketID", socketID)
    console.log('sending invalid query response ...')
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('invalid-query');
  },
  sendChangingAgent: (socketID) => {
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('changing-agent');
  },
  sendGotoGoogle: (socketID) => {
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('go-google');
  },
  sendCloseBrower: (socketID) => {
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('close-brower');
  }
} 