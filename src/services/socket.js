var socketIo = require("socket.io");
var io = socketIo();
var mongoose = require('mongoose');

var socketApi = { io };

const getCurrentSocketID = async (userid) => {

  let user = await mongoose.model('users').findById(userid);
  return user.currentSocketID;
}

io.on('connection', function (socket) {

  console.log('A user connected: ' + socket.id);
  socket.emit('send-id', socket.id);
});

module.exports = {
  socketApi,
  sendCurrentIP: async (userid, ip) => {
    console.log('sending ip ...');
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit("server-send-current-ip", ip)
  },

  sendCurrentUserAgent: async (userid, projectId, data) => {
    try {
      console.log('sending user agent')
      let sockeid = await getCurrentSocketID(userid);
      io.sockets.connected[sockeid].emit('server-send-current-useragent', { data, projectId })
    } catch (error) {
      console.log("TCL: error send user agent", error)

    }

  },
  sendCurrentURL: async (userid, projectId, url) => {
    try {
      console.log("sending url...");
      let sockeid = await getCurrentSocketID(userid);
      io.sockets.connected[sockeid].emit(`server-send-current-url`, { url, projectId })
    } catch (error) {
      console.log("TCL: error send url", error)

    }

  },
  sendNotFoundURL: async (userid, projectId) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('not found url', projectId)
  },
  sendInvalidQuery: async (userid) => {
    console.log('sending invalid query response ...')
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('invalid-query');
  },
  sendChangingAgent: async (userid, projectId) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('changing-agent', projectId);
  },
  sendGotoGoogle: async (userid, projectId) => {
    try {
      console.log('go to google ' + projectId)
      let sockeid = await getCurrentSocketID(userid);
      io.sockets.connected[sockeid].emit('go-google', projectId);
    } catch (error) {
      console.log("TCL: error go-google", error)

    }

  },
  sendCloseBrower: async (userid, projectId) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('close-brower', projectId);
  },
  sendNextPage: async (userid, projectId) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('next-page', projectId);
  },
  sendChangingAgentBacklink: async (userid, projectId) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('changing-agent-backlink', projectId);
  },
  sendCurrentUserAgentBacklink: async (userid, projectId, data) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('agent-backlink', { data, projectId });
  },

  //go to url backlink
  sendGotoDomainBacklink: async (userid, projectId, backlink) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-domain-backlink', { backlink, projectId });
  },

  //finding  main url in backlink
  sendFindingBacklink: async (userid, projectId, urlBacklink) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('finding-backlink', { projectId, urlBacklink });
  },

  //found url matched with keyword
  sendFoundBacklink: async (userid, projectId, mainURL) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('found-backlink', { projectId, mainURL });
  },

  //not found any keyword match with main url
  sendNotFoundBacklink: async (userid, projectId) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('not-found-backlink', projectId);
  },
  sendNotFoundDomainWithKeyword: async (userid, projectId, keyword) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('domain-not-found-suggest', { keyword, projectId });
  },

  //click random url after view main url backlink
  sendRandomURLClicked: async (userid, projectId, url) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-random-url', { url, projectId });
  },

  //not found main url in single backlink
  sendNotFoundURLWithKeywordBacklink: async (userid, projectId, urlBacklink) => {
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('not-found-keyword-backlink', { urlBacklink, projectId });
  },

  sendNotFoundAD: async (userid, projectId) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('not-found-ad', { projectId });
  },

  sendNotFoundSingleAD: async (userid, projectId, adURL) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('not-found-single-ad', { projectId, adURL });
  },

  sendChangingAgentAD: async (userid, projectId) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-changing-agent-ad', { projectId });
  },

  sendCurrentUserAgentAD: async (userid, projectId, agent) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-current-agent-ad', { projectId, agent });
  },

  sendGoToDomainAD: async (userid, projectId, domain) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-gotodomain-ad', { projectId, domain });
  },

  sendFoundAD: async (userid, projectId, adURL) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-found-ad', { projectId, adURL });
  },

  sendStopSuggest: async (userid, projectId) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-stop-suggest', { projectId });
  },

  sendStopAD: async (userid, projectId) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-stop-ad', { projectId });
  },

  sendStopBacklink: async (userid, projectId) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-stop-backlink', { projectId });
  },

  sendInvalidUrlBacklink: async (userid, projectId) => {

    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-invalid-backlink', { projectId });
  },

  //domain containt ad url  invalid
  sendInvalidDomainAD: async (userid, projectId) => {
    console.log("TCL: projectId", projectId)
    console.log("TCL: userid", userid)
    console.log('invalid domain ad')
    let sockeid = await getCurrentSocketID(userid);
    io.sockets.connected[sockeid].emit('send-invalid-domain-ad', { projectId });
  }
} 