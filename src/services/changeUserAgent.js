//var randomUseragent = require('random-useragent');
var { randomAgent } = require('./randomAgent');
const changeUserAgent = async (page) => {
    try {
        console.log('iin chage agent: '+page)
        let result = await randomAgent();
		console.log("TCL: changeUserAgent -> result", result)
        await page.setUserAgent(result);
        return result;
    } catch (error) {
        console.log("TCL: changeUserAgent -> error", error)
    }

}
module.exports = changeUserAgent;