var router = require('express').Router();
var puppeteer = require('puppeteer');
var Const = require("Const");
var searchByKeyWord = require('./../../../services/searchByKeyWord');
var changeUserAgent = require('./../../../services/changeUserAgent');
var setTimeDelay = require('./../../../services/setTimeDelay');
var clickRandom = require('./../../../services/clickRandom');
var clickTitle = require('./../../../services/clickTitle');
var { sendInvalidQuery, sendCurrentUserAgent, sendCurrentURL } = require('services/socket');
router.get('/', async function (req, res, next) {
  res.render('adminpage');
});


router.post('/run', async (req, res) => {
  console.log(req.body)
  let keyword = req.body.keyword;
  let isAutochangeUserAgent = req.body.isAutochangeUserAgent;
  let clickMode = req.body.clickMode;
  let domainToClick = req.body.domainToClick;
  let delayTime = req.body.delayTime;
  let title = req.body.title;
  let numberOfClick = req.body.numberOfClick;
  // if (clickMode == 'manual') {

  // }
  // else if (clickMode == 'auto') {

  // } 
  console.log('in run')
  try {
    for (let i = 0; i < numberOfClick; i++) {
      let isCrashed=await searchAndClickTitle(keyword, title, isAutochangeUserAgent, delayTime);
      if(isCrashed){
        sendInvalidQuery();
        break;
      }
    }
    res.send('ok')
  } catch (error) {
    console.log("TCL: error", error)
  }
})


//delaytime(second)
//return value: true (operation crashed)  false(operation success)
const searchAndClickTitle = async (keyword, title, isChangeUserAgent, delayTime) => {
  let wasClicked = false;
  let runTime = 0;
  while (wasClicked == false) {
    runTime++;
    if (runTime > 5) return true;
    //set up brower and page
    let brower = await puppeteer.launch(Const.options);
 
    const page = await brower.newPage();
    if (isChangeUserAgent) {
      let currentUserAgent = await changeUserAgent();
      await sendCurrentUserAgent(currentUserAgent);
      console.log("TCL: searchAndClick -> currentUserAgent", currentUserAgent)
    }
    await page.setCacheEnabled(false);
    await page.on('console', consoleObj => console.log(consoleObj.text()));


    await page.setViewport({
      width: 1366,
      height: 768,
    });
    try {

      await page.goto('https://www.google.com/');

      await searchByKeyWord(page, keyword);
      //await page.waitForNavigation({ waitUntil: 'load' });
      wasClicked = await clickTitle(page, title)
      await setTimeDelay(delayTime);
      await page.waitFor(Const.timeDelay);
      brower.close();
    } catch (error) {
      console.log("TCL: searchAndClickTitle -> error", error)
      brower.close();
    }
  }
  return false;

}
module.exports = router;
