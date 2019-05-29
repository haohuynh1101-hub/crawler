var router = require('express').Router();
var mongoose = require('mongoose');
var puppeteer = require('puppeteer');
var Const = require("Const");
var searchByKeyWord = require('./../../../services/searchByKeyWord');
var changeUserAgent = require('./../../../services/changeUserAgent');
var setTimeDelay = require('./../../../services/setTimeDelay');
var clickRandom = require('./../../../services/clickRandom');
var suggestDomain = require('./../../../services/suggestDomain');
var getProject = require('./../../../services/getProject');
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
  sendNotFoundBacklink,
  sendNotFoundDomainWithKeyword
} = require('services/socket');

//add project
router.post('/addproject', async (req, res) => {
  try {

    let projects = await mongoose.model('projects').create({ ...req.body, belongTo: req.user._id });

    res.json(projects);

  } catch (error) {

    console.log("TCL: error", error)

    res.json({
      status: 'error',
      message: error
    })
  }

})

//get project by id
router.get('/project/:id', async (req, res) => {

  try {

    let project = await mongoose.model('projects').findById(req.params.id);

    res.json(project);

  } catch (error) {

    res.json(error);
  }

})
router.get('/', async function (req, res, next) {

  try {

    let allProject = await mongoose.model('projects').find({ belongTo: req.user._id });
    
    res.render('adminpage',{allProject});
    
  } catch (error) {

    console.log("render admin page error: ", error)
    next(error);
  }


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

const suggestTask = (keywordSuggest, domain, delaySuggest, socketID, isAutochangeUserAgent) => {

  // let isCrashed = await searchAndSuggest(keywordSuggest, domain, isAutochangeUserAgent, delaySuggest, socketID);

  // if (isCrashed) {

  //   sendInvalidQuery(socketID);
  //   return false;

  // }
}

router.post('/suggest', async (req, res) => {

  let {
    socketID,
    projectId
  } = req.body;

  let { keyword, domain, delay, amount } = await getProject(projectId);

  for (let i = 0; i < amount; i++) {

    let isCrashed = await searchAndSuggestMultipleKeyword(keyword, domain, delay, socketID);

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
const searchAndSuggestSingleKeyword = async (keyword, domain, delayTime, socketID) => {

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

    //change user agent
    //await sendChangingAgent(socketID);
    let currentUserAgent = await changeUserAgent(page);
    //await sendCurrentUserAgent(socketID, currentUserAgent);


    try {

      await page.goto('https://www.google.com/');
      //await sendGotoGoogle(socketID);

      await searchByKeyWord(page, keyword);
      wasClicked = await suggestDomain(socketID, page, domain);

      await setTimeDelay(delayTime);
      await page.waitFor(Const.timeDelay);

      //await sendCloseBrower(socketID);
      brower.close();

    } catch (error) {

      console.log("TCL: searchAndSuggest -> error", error)
      brower.close();
    }
  }

  return false;
}


/**
 * 
 * @param {Array} keyword array of keyword 
 * @param {*} domain 
 * @param {number} delayTime time stay at website after access (seconds)
 * @param {*} socketID 
 * @return {boolean} true (not found any domain with keywords provided)  false(operation success) 
 */
const searchAndSuggestMultipleKeyword = async (keyword, domain, delayTime, socketID) => {

  let isNotFoundDomain;

  for (let i = 0; i < keyword.length; i++) {

    isNotFoundDomain = await searchAndSuggestSingleKeyword(keyword[i], domain, delayTime, socketID);

    //if(isNotFoundDomain) sendNotFoundDomainWithKeyword(socketID,keyword[i]);
  }

  return isNotFoundDomain;

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

      for (let i = 0; i < extractedDOM.length; i++) {

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

  if (wasClicked == false) {
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
