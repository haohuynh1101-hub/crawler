var options=require("Const").options;


//listProxy: array of proxies
//return value: random proxies from listProxy
const changeIP = (listProxy) => {
    let result = listProxy[Math.floor(Math.random() * listProxy.length)];
    options.args=[`--proxy-server=${result}`];
    return result;
}

module.exports=changeIP;