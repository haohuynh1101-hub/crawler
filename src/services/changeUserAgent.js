var randomUseragent = require('random-useragent');

const changeUserAgent=async(page)=>{
    await page.setUserAgent(randomUseragent.getRandom())
}
module.exports=changeUserAgent;