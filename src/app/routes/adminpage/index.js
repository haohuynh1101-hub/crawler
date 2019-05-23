var router = require('express').Router();
var puppeteer = require('puppeteer');
var Const = require("Const");
var searchByKeyWord = require('./../../../services/searchByKeyWord');
var changeUserAgent = require('./../../../services/changeUserAgent');
var setTimeDelay = require('./../../../services/setTimeDelay');
var clickRandom = require('./../../../services/clickRandom');
var suggestDomain = require('./../../../services/suggestDomain');
var { sendCloseBrower, sendGotoGoogle, sendChangingAgent, sendInvalidQuery, sendCurrentUserAgent, sendCurrentURL } = require('services/socket');
router.get('/', async function (req, res, next) {
  res.render('adminpage');
});

router.post('/suggest', async (req, res) => {
  console.log('sugge router')
  let { keywordSuggest, domain, delaySuggest, suggestTime, socketID, isAutochangeUserAgent } = req.body;
  console.log(req.body);
  for (let i = 0; i < suggestTime; i++) {
    let isCrashed = await searchAndSuggest(keywordSuggest, domain, isAutochangeUserAgent, delaySuggest, socketID);
    if (isCrashed) {
      sendInvalidQuery(socketID);
      break;
    }
  }
  res.send('ok');
})


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
    await page.on('console', consoleObj => console.log(consoleObj.text()));
    await page.setViewport({
      width: 1366,
      height: 600,
    });

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

module.exports = router;
