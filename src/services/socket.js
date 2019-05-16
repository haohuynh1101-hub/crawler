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

var socketApi = {io};

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

io.on('connection', function(socket){
  console.log('A user connected: ' + socket.id);

  socket.on('check', data => {
    console.log(data)
  })

  socket.on('i-am-online', data => {
    io.emit('server-i-am-online', data)
  })

});

module.exports = {
  socketApi,
  sendCurrentIP: (ip) => {
    console.log('sending ip ...')
    io.emit("server-send-current-ip", ip)
  },
  sendCurrentUserAgent: (data) => {
      console.log('sending user agent')
    io.emit('server-send-current-useragent', data)
  },
  sendCurrentURL: (url) => {
    console.log("sending url...");
    io.emit(`server-send-current-url`,url)
  },
  sendNotFoundURL:()=>{
    io.emit('not found url')
  }
}