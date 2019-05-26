var router = require('express').Router();
var puppeteer = require('puppeteer');
var Const = require("Const");
var searchByKeyWord = require('./../../../services/searchByKeyWord');
var changeUserAgent = require('./../../../services/changeUserAgent');
var setTimeDelay = require('./../../../services/setTimeDelay');
var clickRandom = require('./../../../services/clickRandom');
var suggestDomain = require('./../../../services/suggestDomain');
var { sendCloseBrower,
  sendGotoGoogle,
  sendChangingAgent,
  sendInvalidQuery,
  sendCurrentUserAgent,
  sendCurrentURL,
  sendChangingAgentBacklink,
  sendCurrentUserAgentBacklink,
  sendGotoDomainBacklink,
  sendFindingBacklink,
  sendFoundBacklink,
  sendNotFoundBacklink
} = require('services/socket');

router.get('/', async function (req, res, next) {

  res.render('adminpage');

});

router.post('/backlink', async (req, res) => {

  let { domain, backlink, amount, delay, socketID } = req.body;

  for (let i = 0; i < amount; i++) {

    let isSuccessed = await clickBackLink(domain, backlink, delay, socketID);

    if (!isSuccessed) {

      sendNotFoundBacklink(socketID, backlink);
      break;

    }

  }

  res.send('ok');

})



router.post('/suggest', async (req, res) => {

  let { keywordSuggest, domain, delaySuggest, suggestTime, socketID, isAutochangeUserAgent } = req.body;

  for (let i = 0; i < suggestTime; i++) {

    let isCrashed = await searchAndSuggest(keywordSuggest, domain, isAutochangeUserAgent, delaySuggest, socketID);

    if (isCrashed) {

      sendInvalidQuery(socketID);
      break;

    }

  }

  res.send('ok');

})


/**
 * 
 * @param {*} keyword 
 * @param {*} domain 
 * @param {bool} isChangeUserAgent 
 * @param {number} delayTime time stay at website after access (seconds)
 * @param {*} socketID 
 * @return {boolean} true (operation crashed)  false(operation success) 
 */
const searchAndSuggest = async (keyword, domain, isChangeUserAgent, delayTime, socketID) => {

  let wasClicked = false;
  let runTime = 0;

  while (wasClicked == false) {

    runTime++;

    if (runTime > 3) return true;

    //set up brower and page
    let brower = await puppeteer.launch(Const.options);
    const page = await brower.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({
      width: 1366,
      height: 768,
    });
    await page.on('console', consoleObj => console.log(consoleObj.text()));

    if (isChangeUserAgent) {
      await sendChangingAgent(socketID);
      let currentUserAgent = await changeUserAgent(page);
      await sendCurrentUserAgent(socketID, currentUserAgent);
    }

    try {

      await page.goto('https://www.google.com/');
      await sendGotoGoogle(socketID);

      await searchByKeyWord(page, keyword);
      wasClicked = await suggestDomain(socketID, page, domain);

      await setTimeDelay(delayTime);
      await page.waitFor(Const.timeDelay);

      await sendCloseBrower(socketID);
      brower.close();

    } catch (error) {
      console.log("TCL: searchAndSuggest -> error", error)
      brower.close();
    }
  }
  return false;
}


/**
 * go to domain , find and click backlink
 * @param {*} domain 
 * @param {*} backlink 
 * @param {*} delay second
 * @param {*} socketID 
 * @return {boolean} true(operation successed) | false(operation falsed)
 */
const clickBackLink = async (domain, backlink, delay, socketID) => {

  //set up brower and page
  let brower = await puppeteer.launch(Const.options);
  const page = await brower.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({
    width: 1366,
    height: 768,
  });
  await page.on('console', consoleObj => console.log(consoleObj.text()));

  //change user agent
  await sendChangingAgentBacklink(socketID);
  let currentUserAgent = await changeUserAgent(page);
  await sendCurrentUserAgentBacklink(socketID, currentUserAgent);

  //go to domain
  //find and click backlink
  await sendGotoDomainBacklink(socketID, domain);
  await page.goto(domain);

  await sendFindingBacklink(socketID);
  let wasClicked = await page.evaluate(async (backlink) => {

    //search all dom tree to find backlink
    let extractedDOM = await document.querySelectorAll(`a`);

    if (extractedDOM.length == 0) return false;

    try {

      for(let i=0;i<extractedDOM.length;i++){

        if (extractedDOM[i].innerText.includes(backlink)) {

          await extractedDOM[i].click();
          return true;
        }
      }
      
      return false;
    } catch (error) {

      console.log("TCL: clickBackLink -> error", error)
      return false;
    }

  }, backlink);

  if (wasClicked==false) {
    await brower.close();
    return false;
  }

  //set time stay on page after click
  await sendFoundBacklink(socketID, backlink);
  await setTimeDelay(delay);
  await page.waitFor(Const.timeDelay);

  await brower.close();
  return true;

}

module.exports = router;
