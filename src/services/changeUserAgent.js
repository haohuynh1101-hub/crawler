//var randomUseragent = require('random-useragent');
var {randomAgent}=require('./randomAgent');
const changeUserAgent=async()=>{
    let result=await randomAgent();
    return result;
}
module.exports=changeUserAgent;