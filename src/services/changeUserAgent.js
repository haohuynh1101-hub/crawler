var randomUseragent = require('random-useragent');

const changeUserAgent=async(page)=>{
    let UA=randomUseragent.getRandom();
    await page.setUserAgent(UA);
    return UA;
}
module.exports=changeUserAgent;