var router = require('express').Router();
var puppeteer = require('puppeteer');
var Const = require("Const");
var searchByKeyWord = require('./../../../services/searchByKeyWord');
var changeUserAgent = require('./../../../services/changeUserAgent');
var setTimeDelay = require('./../../../services/setTimeDelay');
var clickRandom = require('./../../../services/clickRandom');
var clickTitle = require('./../../../services/clickTitle');
var suggestDomain=require('./../../../services/suggestDomain');
var {sendCloseBrower,sendGotoGoogle,sendChangingAgent, sendInvalidQuery, sendCurrentUserAgent, sendCurrentURL } = require('services/socket');
router.get('/', async function (req, res, next) {
  res.render('adminpage');
});

router.post('/suggest',async(req,res)=>{
  console.log('sugge router')
  let{keywordSuggest,domain,delaySuggest,suggestTime,socketID,isAutochangeUserAgent}=req.body;
  console.log(req.body);
  for(let i=0;i<suggestTime;i++){
    let isCrashed=await searchAndSuggest(keywordSuggest,domain,isAutochangeUserAgent,delaySuggest,socketID);
    if(isCrashed){
      sendInvalidQuery(socketID);
      break;
    }
  }
  res.send('ok');
})
router.post('/run', async (req, res) => {
  console.log(req.body)
  let keyword = req.body.keyword;
  let isAutochangeUserAgent = req.body.isAutochangeUserAgent;
  let clickMode = req.body.clickMode;
  let domainToClick = req.body.domainToClick;
  let delayTime = req.body.delayTime;
  let title = req.body.title;
  let numberOfClick = req.body.numberOfClick;
  let socketID=req.body.socketID;
  // if (clickMode == 'manual') {

  // }
  // else if (clickMode == 'auto') {

  // } 
  console.log('in run')
  try {
    for (let i = 0; i < numberOfClick; i++) {
      let isCrashed=await searchAndClickTitle(keyword, title, isAutochangeUserAgent, delayTime,socketID);
      if(isCrashed){
        sendInvalidQuery(socketID);
        break;
      }
    }
    res.send('ok')
  } catch (error) {
    console.log("TCL: error", error)
  }
})

const searchAndSuggest=async(keyword, domain, isChangeUserAgent, delayTime,socketID)=>{
  let wasClicked = false;
  let runTime = 0;
  while (wasClicked == false) {
    runTime++;
    if (runTime > 3) return true;
    //set up brower and page
    let brower = await puppeteer.launch(Const.options);
 
    const page = await brower.newPage();
    if (isChangeUserAgent) {
      await sendChangingAgent(socketID);
      console.log('page before call change agent')
      let currentUserAgent = await changeUserAgent(page);
      await sendCurrentUserAgent(socketID,currentUserAgent);
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
      await sendGotoGoogle(socketID);
      await searchByKeyWord(page, keyword);
      //await page.waitForNavigation({ waitUntil: 'load' });
      wasClicked = await suggestDomain(socketID,page,domain);
      await setTimeDelay(delayTime);
      await page.waitFor(Const.timeDelay);
      await sendCloseBrower(socketID);
      brower.close();
    } catch (error) {
      console.log("TCL: searchAndClickTitle -> error", error)
      brower.close();
    }
  }
  return false;
}

//delaytime(second)
//return value: true (operation crashed)  false(operation success)
const searchAndClickTitle = async (keyword, title, isChangeUserAgent, delayTime,socketID) => {
  let wasClicked = false;
  let runTime = 0;
  while (wasClicked == false) {
    runTime++;
    if (runTime > 3) return true;
    //set up brower and page
    let brower = await puppeteer.launch(Const.options);
 
    const page = await brower.newPage();
    if (isChangeUserAgent) {
      await sendChangingAgent(socketID);
      let currentUserAgent = await changeUserAgent(page);
      await sendCurrentUserAgent(socketID,currentUserAgent);
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
      await sendGotoGoogle(socketID);
      await searchByKeyWord(page, keyword);
      //await page.waitForNavigation({ waitUntil: 'load' });
      wasClicked = await clickTitle(socketID,page, title)
      await setTimeDelay(delayTime);
      await page.waitFor(Const.timeDelay);
      await sendCloseBrower(socketID);
      brower.close();
    } catch (error) {
      console.log("TCL: searchAndClickTitle -> error", error)
      brower.close();
    }
  }
  return false;

}
module.exports = router;
