var socketIo = require("socket.io");
var io = socketIo();
var mongoose = require('mongoose');



var socketApi = { io };
var connectedUsers = [];

const getSocket = (userID, array) => {
  for (var i = 0; i < array.length; i++) {
    if (array[i].id === userID) {
      return array[i].socket;

    }
  }
}


const getCurrentSocketID = async (userid) => {

  let user = await mongoose.model('users').findById(userid);
  return user.currentSocketID;
}

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
  sendCurrentIP: async (userid, ip) => {
    console.log('sending ip ...');
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit("server-send-current-ip", ip)
  },
  sendCurrentUserAgent: async (userid, projectId, data) => {
    try {
      console.log('sending user agent')
      let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
      userSocket.emit('server-send-current-useragent', { data, projectId })
    } catch (error) {
      console.log("TCL: error send user agent", error)

    }

  },
  sendCurrentURL: async (userid, projectId, url) => {
    try {
      console.log("sending url...");
      let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
      userSocket.emit(`server-send-current-url`, { url, projectId })
    } catch (error) {
      console.log("TCL: error send url", error)

    }

  },
  sendNotFoundURL: async (userid, projectId) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('not found url', projectId)
  },
  sendInvalidQuery: async (userid) => {
    console.log('sending invalid query response ...')
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('invalid-query');
  },
  sendChangingAgent: async (userid, projectId) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('changing-agent', projectId);
  },
  sendGotoGoogle: async (userid, projectId) => {
    try {
      console.log('go to google ' + projectId)
      let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
      userSocket.emit('go-google', projectId);
    } catch (error) {
      console.log("TCL: error go-google", error)

    }

  },
  sendCloseBrower: async (userid, projectId) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('close-brower', projectId);
  },
  sendNextPage: async (userid, projectId) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('next-page', projectId);
  },
  sendChangingAgentBacklink: async (userid,projectId) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('changing-agent-backlink',projectId);
  },
  sendCurrentUserAgentBacklink: async (userid,projectId, data) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('agent-backlink', {data,projectId});
  },

  //go to url backlink
  sendGotoDomainBacklink: async (userid,projectId, domain) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('send-domain-backlink', {domain,projectId});
  },

  //finding keyword matched url in url backlink
  sendFindingBacklink: async (userid,projectId) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('finding-backlink',projectId);
  },
  sendFoundBacklink: async (userid, link) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('found-backlink', link);
  },
  
  //not found any keyword match with main url
  sendNotFoundBacklink: async (userid, projectId) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('not-found-backlink', projectId);
  },
  sendNotFoundDomainWithKeyword: async (userid, projectId, keyword) => {
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('domain-not-found-suggest', { keyword, projectId });
  },

  //click random url after view main url backlink
  sendRandomURLClicked:async(userid,projectId,url)=>{
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('send-random-url', { url, projectId });
  },
  sendNotFoundURLWithKeywordBacklink:async(userid,projectId,keyword)=>{
    let userSocket = getSocket(await getCurrentSocketID(userid), connectedUsers);
    userSocket.emit('not-found-keyword-backlink', { keyword, projectId });
  }
} 