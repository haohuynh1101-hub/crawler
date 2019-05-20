//var randomUseragent = require('random-useragent');
var { randomAgent } = require('./randomAgent');
const changeUserAgent = async () => {
    try {
        let result = await randomAgent();
        await page.setUserAgent(result);
        return result;
    } catch (error) {
        console.log("TCL: changeUserAgent -> error", error)
    }

}
module.exports = changeUserAgent;