var options=require("Const").options;
var {sendCurrentIP}=require('./socket');

//listProxy: array of proxies
//return value: random proxies from listProxy
const changeIP = (listProxy) => {
    let result = listProxy[Math.floor(Math.random() * listProxy.length)];
    sendCurrentIP(result);
    options.args=[`--proxy-server=${result}`];
    return result;
}

module.exports=changeIP;