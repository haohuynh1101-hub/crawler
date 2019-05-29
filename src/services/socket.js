var socketIo = require("socket.io");
var io = socketIo();



var socketApi = { io };
var connectedUsers = [];

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
    console.log('sending user agent')
    let userSocket = getSocket(socketID, connectedUsers);
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
  },
  sendNextPage:(socketID)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    console.log('domain not found, finding in next page ...');
    userSocket.emit('next-page');
  },
  sendChangingAgentBacklink:(socketID)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    console.log('changing user agent ...');
    userSocket.emit('changing-agent-backlink');
  },
  sendCurrentUserAgentBacklink:(socketID,data)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('agent-backlink',data);
  },
  sendGotoDomainBacklink:(socketID,domain)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('send-domain-backlink',domain);
  },
  sendFindingBacklink:(socketID)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('finding-backlink');
  },
  sendFoundBacklink:(socketID,link)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('found-backlink',link);
  },
  sendNotFoundBacklink:(socketID,link)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('not-found-backlink',link);
  },
  sendNotFoundDomainWithKeyword:(socketID,keyword)=>{
    let userSocket = getSocket(socketID, connectedUsers);
    userSocket.emit('domain-not-found-suggest',keyword);
  }
} 