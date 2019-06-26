var router = require('express').Router();
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var puppeteer = require('puppeteer');
var Const = require("Const");
var searchByKeyWord = require('./../../../services/searchByKeyWord');
var changeUserAgent = require('./../../../services/changeUserAgent');
var setTimeDelay = require('./../../../services/setTimeDelay');
var clickRandom = require('./../../../services/clickRandom');
var suggestDomain = require('./../../../services/suggestDomain');
var getProject = require('./../../../services/getProject');
var { saveLog, saveLogBacklink, saveLogAD } = require('./../../../services/saveLog');
var clickRandomURL = require('./../../../services/clickRandomURL');
var setSchedule = require('./../../../services/setSchedule');
var moment = require('moment-timezone');
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
  sendNotFoundDomainWithKeyword,
  sendRandomURLClicked,
  sendChangingAgentAD,
  sendNotFoundAD,
  sendNotFoundSingleAD,
  sendCurrentUserAgentAD,
  sendGoToDomainAD,
  sendFoundAD,
  sendNotFoundURLWithKeywordBacklink,
  sendStopSuggest,
  sendStopAD,
  sendStopBacklink,
  sendInvalidUrlBacklink,
  sendInvalidDomainAD,
  sendGotoGoogleVN
} = require('services/socket');

//this is backdoor
//remove in production env
router.get('/backdoor', async (req, res) => {
  let result = await mongoose.model('users').find();
  res.json(result);
})
router.get('/clear', async (req, res) => {

  await mongoose.model('projects').remove();
  await mongoose.model('logs').remove();
  await mongoose.model('projectBacklinks').remove();
  await mongoose.model('projectAds').remove();
  await mongoose.model('logBacklinks').remove();
  await mongoose.model('logAds').remove();
  await mongoose.model('users').remove();

  res.send('ok')
})
router.get('/test', async (req, res) => {

  let result = await mongoose.model('projects').findById('5cf9de56ce0c2f19ec78cd73');
  console.log(result);
  res.send('ok')
})
router.get('/reset', async (req, res) => {

  await mongoose.model('projects').updateMany({ status: 'stopped' });

  await mongoose.model('projectBacklinks').updateMany({ status: 'stopped' });

  await mongoose.model('projectAds').updateMany({ status: 'stopped' });

  res.send('ok');
})


//get all project info
router.get('/allProject', async (req, res) => {

  let suggest = await mongoose.model('projects').find();
  console.log("TCL: suggest", suggest)
  let backlink = await mongoose.model('projectBacklinks').find();
  let ad = await mongoose.model('projectAds').find();

  res.json({
    suggest: suggest,
    backlink: backlink,
    ad: ad
  });
})
//end backdoor

//get user info by id
router.get('/users/:id', async (req, res) => {

  try {

    let user = await mongoose.model('users').findById(req.params.id).populate('role');

    res.send(user);
  } catch (error) {

    console.log('err in get user info: ' + error);
    res.send('can not get user info: ' + error);
  }

})

//update user by id
router.post('/users/:id', async (req, res) => {

  try {

    let { traffic } = req.body;

    let user = await mongoose.model('users').findById(req.params.id);

    user.traffic = traffic;

    await user.save();

    res.redirect('/users')

  } catch (error) {

    console.log('err in update user info: ' + error);
    res.send('can not update user: ' + error);
  }

})

//logout router
router.post('/logout', async (req, res) => {

  if (req.signedCookies) {
    // delete session object
    await res.clearCookie("user", { path: "/" });
  }
  return res.redirect('/login');
})

/**
 * change password
 */
router.post('/changePassword', async (req, res) => {

  let { oldPassword, newPassword } = req.body;

  //check wrong password
  let userid = req.signedCookies.user;
  let user = await mongoose.model("users").findById(userid);

  if (!bcrypt.compareSync(oldPassword, user.password)) {
    res.send('wrong password');
  }
  else {

    //change password
    const saltRounds = 10;
    bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
      user.password = hash;
      await user.save();
      res.send('ok');
    });
  }



})

//user management page
router.get('/users', async (req, res) => {
  let users = await mongoose.model('users').find().populate('role');

  let roles = await mongoose.model('role').find();
  res.render('admin', { users, roles, currentUser: req.signedCookies.user });
})


//users create router
router.post('/users', async function (req, res, next) {

  try {
    let users = await mongoose.model('users').find().populate('role');
    let roles = await mongoose.model('role').find();
    let groupMaxDate = await mongoose.model('role').findById(req.body.role);
    groupMaxDate = groupMaxDate.maxUsingDate;


    let insert = {
      ...req.body
    }
    insert.expiredDate = moment(new Date()).add(groupMaxDate, 'day');


    const saltRounds = 10;
    let oldUser = await mongoose.model('users').findOne({ username: insert.username })
    if (oldUser) {
      return res.render('admin', { users, roles, error: "Username đã tồn tại!!" });
    }

    bcrypt.hash(insert.password, saltRounds, async (err, hash) => {
      insert.password = hash;
      await mongoose.model('users').create(insert)
    });
    return res.redirect('/users');
  } catch (error) {

    console.log("create new account error: ", error)
    next(error);
  }


});


router.delete('/users/:id', async (req, res, next) => {
  try {
    await mongoose.model('users').findOneAndDelete({ _id: req.params.id });
    return res.redirect('/users')
  } catch (error) {
    console.log(error);
    next(error)
  }
})

//create group router
router.post('/groupUsers', async function (req, res, next) {

  try {

    let insert = {
      name: req.body.groupName,
      canSuggest: (req.body.canSuggest == 'true') ? true : false,
      canBacklink: (req.body.canBacklink == 'true') ? true : false,
      canClickAD: (req.body.canClickAD == 'true') ? true : false,
      canManageUser: (req.body.canManageUser == 'true') ? true : false,
      maxUsingDate: req.body.maxDate
    }
    await mongoose.model('role').create(insert);
    return res.redirect('/users');
  } catch (error) {

    console.log("render admin page error: ", error)
    next(error);
  }


});

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

    let numberOfProject = await mongoose.model('projectAds').find({ belongTo: req.signedCookies.user }).count();

    if (numberOfProject == 0) {

      let projects = await mongoose.model('projectAds').create({ ...req.body, adURL: JSON.parse(req.body.adURL), belongTo: req.signedCookies.user, status: 'not started' });

      res.json(projects);
    }

    res.redirect('/');
  } catch (error) {

    console.log("save new ad project err ", error)

    res.json({
      status: 'error',
      message: error
    })
  }
})

/**
 * a function that contain "clickADTask" function to handle stopped signal from user.
 *  Call this function instead of "clickADTask"
 * @param {*} req 
 * @param {*} res 
 */
const ADTaskContainer = async (req, res) => {

  try {

    await clickADTask(req, res);
  } catch (error) {

    //change project status to stopped 
    //reset isForceStopped to false
    let { projectId, userid } = req.body;
    let updateProject = await mongoose.model('projectAds').findById(projectId);
    updateProject.status = 'stopped';
    updateProject.isForceStop = false;
    await updateProject.save();

    //send reload page socket
    await sendStopAD(userid, projectId);
  }
}

const clickADTask = async (req, res) => {

  return new Promise(async (resolve, reject) => {

    try {

      let { projectId, userid } = req.body;

      //set status of project to "running"
      let updateProject = await mongoose.model('projectAds').findById(projectId);
      let { amount } = updateProject;
      updateProject.status = 'running';
      updateProject.save();

      //main process
      for (let i = 0; i < amount; i++) {

        let { domain, adURL, delay, isForceStop } = await mongoose.model('projectAds').findById(projectId);

        if (isForceStop) throw new Error('Your ad task is forced to stopped by user !!!');

        let isSuccessed = await clickAD(domain, adURL, delay, projectId, userid);

        if (isSuccessed == false) {

          saveLogAD(projectId, 'Không tìm thấy bất kì url quảng cáo nào trùng khớp, vui lòng kiểm tra lại !!!');
          sendNotFoundAD(userid, projectId);
          break;
        }
      }

      //set status of project to "stopped"
      //reset is force stop to fasle
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      updateProject.save();
      await sendStopAD(userid, projectId);

      res.send('ok');

    } catch (error) {

      return reject(error);
    }
  });
}

/**
 * delete ad project by id
 * req.params: 
 * id 
 */
router.get('/deleteAD/:id', async (req, res) => {

  try {

    await mongoose.model('projectAds').findOneAndDelete({ _id: req.params.id });
    res.send('ok');

  } catch (error) {

    console.log('err when delete ad project: ' + err);
    res.send('failed');
  }

})

/**
 * click some ad in given url
 * req.body:
 * projectId
 * userid
 */
router.post('/clickAd', async (req, res, next) => {

  if (JSON.parse(req.body.isRunNow) == true) {

    ADTaskContainer(req, res);
  }
  else {

    //set status of project to "waiting"
    try {

      let updateProject = await mongoose.model('projectAds').findById(req.body.projectId);

      updateProject.status = `Sẽ chạy lúc ${req.body.hour}:${req.body.minute}  ${req.body.day}/${req.body.month}`;
      updateProject.save();

    } catch (error) {

      console.log('error when change ad project status', error);
      throw error;
    }

    //main process
    let day = parseInt(req.body.day);
    let month = parseInt(req.body.month);
    let hour = parseInt(req.body.hour);
    let minute = parseInt(req.body.minute);
    let second = parseInt(req.body.second);

    setSchedule(day, month, hour, minute, second, ADTaskContainer, req, res, next);
  }
})

/**
 * update ad project
 * params: id
 * body: 
 * adURL
 * domain
 * delay
 * amount
 * name
 */
router.post('/editAD/:id', async (req, res) => {

  try {

    let { adURL,domain,delay,amount,name } = req.body;

    let project = await mongoose.model('projectAds').findById(req.params.id);
    project.name = name;
    project.adURL = JSON.parse(adURL);
    project.domain = domain;
    project.delay = delay;
    project.amount = amount;

    await project.save();
    res.redirect('/');

  } catch (error) {

    console.log('err when update ad project ' + error);
    res.redirect('/');
  }
})

/**
 * get ad project by id
 * req.param:
 * id (project id)
 * @return :
 * adURL : Array
 * domain: string
 * delay: number
 * amount :number
 * name : string
 */
router.get('/ad/:id', async (req, res) => {

  try {

    let result = await mongoose.model('projectAds').findById(req.params.id).populate('log');

    res.json(result);

  } catch (error) {

    console.log('err get ad project info: ' + error);
  }

})


//add project suggest
//call when client click save new project button
router.post('/addproject', async (req, res) => {
  try {

    let numberOfProject = await mongoose.model('projects').find({ belongTo: req.signedCookies.user }).count();

    if (numberOfProject == 0) {

      let projects = await mongoose.model('projects').create({ ...req.body, keyword: JSON.parse(req.body.keyword), belongTo: req.signedCookies.user, status: 'not started' });

      res.json(projects);
    }

    res.redirect('/');

  } catch (error) {

    console.log("TCL: error", error)

    res.json({
      status: 'error',
      message: error
    })
  }

});

/**
 * update suggest project by id
 * req.param : id
 * req.body:
 * name
 * keyword
 * domain
 * searchTool
 * amount
 */
router.post('/editSuggest/:id', async (req, res) => {

  try {

    let { name, keyword, domain, delay, searchTool, amount } = req.body;

    let project = await mongoose.model('projects').findById(req.params.id);
    project.name = name;
    project.keyword = keyword;
    project.domain = domain;
    project.delay = delay;
    project.searchTool = searchTool;
    project.amount = amount;
    project.keyword = JSON.parse(req.body.keyword);

    await project.save();
    res.redirect('/');

  } catch (error) {

    console.log('err when update sugest project ' + error);
    res.redirect('/');
  }
})

//get project suggest by id
//call when client click view detail button
router.get('/project/:id', async (req, res) => {

  try {

    let project = await mongoose.model('projects').findById(req.params.id).populate('log');

    res.json(project);

  } catch (error) {

    res.json(error);
  }

})


function returnAdminpage() {
  return async (req, res, next) => {
    let user = await mongoose.model('users').findById(req.signedCookies.user);
    let role = await mongoose.model('role').findOne({ _id: user.role });
    if (role.canManageUser) {
      return res.redirect('/users')
    }
    next();
  }
}

const isExpiredUser = (userObject) => {

  let currentDate = moment(new Date());
  let expiredDate = moment(userObject.expiredDate);

  if ((expiredDate - currentDate).valueOf() > 0) return false;
  return true;
}


//homepage router
router.get('/', returnAdminpage(), async function (req, res, next) {
  try {
    let user = await mongoose.model('users').findById(req.signedCookies.user)
    let allProject = await mongoose.model('projects').find({ belongTo: user._id });
    let allBackLinkProject = await mongoose.model('projectBacklinks').find({ belongTo: user._id });
    let allAdProject = await mongoose.model('projectAds').find({ belongTo: user._id });
    let role = await mongoose.model('role').findOne({ _id: user.role });
    let traffic = user.traffic;

    if (isExpiredUser(user) == false)
      res.render('adminpage', { allProject, allBackLinkProject, allAdProject, role, traffic });
    else
      res.render('login', { isExpired: true });

  } catch (error) {

    console.log("render admin page error: ", error)
    next(error);
  }


});



//
/**
 * save new project backlink
 * req.body:
 * urlBacklink: Array
 * mainURL
 * amount
 * name
 */
router.post('/saveProjectBacklink', async (req, res) => {

  try {

    let numberOfProject = await mongoose.model('projectBacklinks').find({ belongTo: req.signedCookies.user }).count();

    if (numberOfProject == 0) {

      let projects = await mongoose.model('projectBacklinks').create({ ...req.body, urlBacklink: JSON.parse(req.body.urlBacklink), belongTo: req.signedCookies.user, status: 'not started' });

      res.json(projects);
    }

    res.redirect('/');
  } catch (error) {

    console.log("save new project backlink err ", error)

    res.json({
      status: 'error',
      message: error
    })
  }
})

/**
 * update backlink project
 * params: id
 * body:
 * urlBacklink
 * mainURL
 * delay
 * amount
 * name
 */
router.post('/editBacklink/:id', async (req, res) => {

  try {

    let {urlBacklink,mainURL,delay,amount,name } = req.body;

    let project = await mongoose.model('projectBacklinks').findById(req.params.id);
    project.name = name;
    project.urlBacklink = JSON.parse(urlBacklink);
    project.mainURL = mainURL;
    project.delay = delay;
    project.amount = amount;

    await project.save();
    res.redirect('/');

  } catch (error) {

    console.log('err when update backlink project ' + error);
    res.redirect('/');
  }
  
})

//get backlink project info by id
//use when user click view detail button
router.get('/backlinkproject/:id', async (req, res) => {

  try {

    let projectInfo = await mongoose.model('projectBacklinks').findById(req.params.id).populate('log');

    res.json(projectInfo);

  } catch (error) {

    console.log('view backlink detail err: ' + error);
  }

})

/**
 * a function that contain "backlinkTask" function to handle stopped signal from user.
 *  Call this function instead of "backlinkTask"
 * @param {*} req 
 * @param {*} res 
 */
const backlinkTaskContainer = async (req, res) => {

  try {

    await backlinkTask(req, res);
  } catch (error) {

    //change project status to stopped 
    //reset isForceStopped to false
    let { projectId, userid } = req.body;
    let updateProject = await mongoose.model('projectBacklinks').findById(projectId);
    updateProject.status = 'stopped';
    updateProject.isForceStop = false;
    await updateProject.save();

    //send reload page socket
    await sendStopBacklink(userid, projectId);
  }
}

const backlinkTask = async (req, res) => {

  return new Promise(async (resolve, reject) => {

    try {

      let { projectId, userid } = req.body;

      //set status of project to "running"
      let updateProject = await mongoose.model('projectBacklinks').findById(projectId);
      let { amount } = updateProject;
      updateProject.status = 'running';
      await updateProject.save();

      //main process
      for (let i = 0; i < amount; i++) {

        //get project info
        let { urlBacklink, mainURL, delay, isForceStop } = await mongoose.model('projectBacklinks').findById(projectId);

        if (isForceStop) throw new Error('Your backlink task is forced to stopped by user !!!');

        let isSuccessed = await clickBackLink(urlBacklink, mainURL, delay, amount, projectId, userid);

        if (isSuccessed == false) {

          sendNotFoundBacklink(userid, projectId);
          saveLogBacklink(projectId, 'Không tìm thấy site chính trong backlink , vui lòng thử lại sau !!!');
          break;
        }
      }

      //set status of project to "stopped"
      //reset is force stop to fasle
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      updateProject.save();
      await sendStopBacklink(userid, projectId);

      res.send('ok');

    } catch (error) {

      return reject(error);
    }
  });
}

/**
 * delete backlink project by id
 * req.params: 
 * id 
 */
router.get('/deleteBacklink/:id', async (req, res) => {

  try {

    await mongoose.model('projectBacklinks').findOneAndDelete({ _id: req.params.id });
    res.send('ok');

  } catch (error) {

    console.log('err when delete backlink project: ' + err);
    res.send('failed');
  }

})

/**
 * click baclink
 * call when user click run button
 * req.body:
 * userid
 * projectId
 */
router.post('/backlink', async (req, res, next) => {

  if (JSON.parse(req.body.isRunNow) == true) {

    backlinkTaskContainer(req, res);
  }
  else {

    //set status of project to "waiting"
    try {

      let updateProject = await mongoose.model('projectBacklinks').findById(req.body.projectId);

      updateProject.status = `Sẽ chạy lúc ${req.body.hour}:${req.body.minute}  ${req.body.day}/${req.body.month}`;
      updateProject.save();

    } catch (error) {

      console.log('error when change backlink project status', error);
      throw error;
    }

    //main process
    let day = parseInt(req.body.day);
    let month = parseInt(req.body.month);
    let hour = parseInt(req.body.hour);
    let minute = parseInt(req.body.minute);
    let second = parseInt(req.body.second);

    setSchedule(day, month, hour, minute, second, backlinkTaskContainer, req, res, next);
  }

})

/**
 * a function that contain "suggestTask" function to handle stopped signal from user.
 *  Call this function instead of "suggestTask"
 * @param {*} req 
 * @param {*} res 
 */
const suggestTaskContainer = async (req, res) => {

  try {

    await suggestTask(req, res);
  } catch (error) {

    //change project status to stopped 
    //reset isForceStopped to false
    let { projectId, userid } = req.body;
    let updateProject = await getProject(projectId);
    updateProject.status = 'stopped';
    updateProject.isForceStop = false;
    await updateProject.save();

    //send reload page socket
    await sendStopSuggest(userid, projectId);
  }
}


const suggestTask = async (req, res) => {

  return new Promise(async (resolve, reject) => {

    try {

      let { projectId, userid } = req.body;

      //set status of project to "running"
      let updateProject = await getProject(projectId);
      let { amount } = updateProject;
      updateProject.status = 'running';
      await updateProject.save();

      //main process 
      for (let i = 0; i < amount; i++) {

        let { keyword, domain, delay, isForceStop, searchTool } = await getProject(projectId);

        if (isForceStop) throw new Error('Your suggest task is forced to stopped by user !!!');

        let isCrashed = await searchAndSuggestMultipleKeyword(searchTool, keyword, domain, delay, projectId, userid);

        if (isCrashed) {

          sendInvalidQuery(userid);
          break;
        }

      }

      //set status of project to "stopped"
      //reset is force stop to fasle
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();
      //send reload page socket
      await sendStopSuggest(userid, projectId);

      res.send('ok');

    } catch (error) {

      return reject(error);
    }
  });
}

/**
 * stop project suggest
 * update project status to "Dang dung"
 * update isForceStop = true
 */
router.get('/stopSuggest/:id', async (req, res) => {

  let updateProject = await getProject(req.params.id);
  updateProject.isForceStop = true;
  updateProject.status = 'Đang dừng ...';
  await updateProject.save();
  res.redirect('/');
});

/**
 * stop project ad
 * update project status to "Dang dung"
 * update isForceStop = true
 */
router.get('/stopAD/:id', async (req, res) => {

  let updateProject = await mongoose.model('projectAds').findById(req.params.id);

  if (updateProject.isForceStop == false && updateProject.status == 'running') {

    updateProject.isForceStop = true;
    updateProject.status = 'Đang dừng ...';
    await updateProject.save();
  }

  res.redirect('/');
});

/**
 * stop project backlink
 * update project status to "Dang dung"
 * update isForceStop = true
 */
router.get('/stopBacklink/:id', async (req, res) => {

  let updateProject = await mongoose.model('projectBacklinks').findById(req.params.id);

  if (updateProject.isForceStop == false && updateProject.status == 'running') {

    updateProject.isForceStop = true;
    updateProject.status = 'Đang dừng ...';
    await updateProject.save();
  }

  res.redirect('/');
});

/**
 * delete suggest project by id
 * req.params: 
 * id 
 */
router.get('/deleteSuggest/:id', async (req, res) => {

  try {

    await mongoose.model('projects').findOneAndDelete({ _id: req.params.id });
    res.send('ok');

  } catch (error) {

    console.log('err when delete suggest project: ' + err);
    res.send('failed');
  }

})

//suggest domain request
router.post('/suggest', async (req, res, next) => {

  if (JSON.parse(req.body.isRunNow) == true) {

    suggestTaskContainer(req, res);
  }
  else {

    //set status of project to "waiting"
    try {

      let updateProject = await mongoose.model('projects').findById(req.body.projectId);

      updateProject.status = `Sẽ chạy lúc ${req.body.hour}:${req.body.minute}  ${req.body.day}/${req.body.month}`;
      updateProject.save();

    } catch (error) {

      console.log('error when change project status to waiting', error);
      throw error;
    }

    let day = parseInt(req.body.day);
    let month = parseInt(req.body.month);
    let hour = parseInt(req.body.hour);
    let minute = parseInt(req.body.minute);
    let second = parseInt(req.body.second);

    setSchedule(day, month, hour, minute, second, suggestTaskContainer, req, res, next);
  }

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
 * go to domain, find and click adURL
 * @param {*} domain 
 * @param {*} adURL 
 * @param {*} delay 
 * @param {*} projectId 
 * @param {*} userid 
 * @returns {boolean} true (found and clicked) || false (ad url not found) 
 */
const clickSingleAD = async (domain, adURL, delay, projectId, userid) => {

  //set up brower and page
  let brower = await puppeteer.launch(Const.options);
  const page = await brower.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({
    width: 1366,
    height: 768,
  });
  await page.on('console', consoleObj => console.log(consoleObj.text()));


  //start job
  try {

    //change user agent
    await sendChangingAgentAD(userid, projectId);
    await saveLogAD(projectId, 'Đang thay đổi user agent ...');
    let currentUserAgent = await changeUserAgent(page);
    await page.authenticate({ username: 'lum-customer-pingo-zone-static-session-rand39484', password: '27o6ps39ddbf' });
    await sendCurrentUserAgentAD(userid, projectId, currentUserAgent);
    await saveLogAD(projectId, `User agent hiện tại: ${currentUserAgent}`);

    //extract real ad url
    adURL = adURL.replace('https://', '');
    adURL = adURL.replace('http://', '');
    adURL = adURL.split('/')[0];

    //go to domain
    //find and click ad 
    await sendGoToDomainAD(userid, projectId, domain);
    await saveLogAD(projectId, `Đang truy cập "${domain}"`);

    try {

      await page.goto(domain, { 'waitUntil': 'networkidle0' });
    } catch (error) {

      console.log('invalid domain click ad feature');

      //change project status to stopped 
      //reset isForceStopped to false
      let updateProject = await mongoose.model('projectAds').findById(projectId);
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();
      await sendStopAD(userid, projectId);

      await brower.close();
      return false;
    }



    let wasClicked = await page.evaluate(async (adURL) => {

      //search all dom tree to find ad url
      let extractedDOM = await document.querySelectorAll(`a[href*="${adURL}"]`);

      if (extractedDOM.length == 0) return false;

      try {

        await extractedDOM[0].click();
        return true;

      } catch (error) {

        console.log("error click single ad ", error)
        return false;
      }

    }, adURL);

    if (wasClicked == false) {

      sendCloseBrower(userid, projectId);
      saveLogAD(projectId, 'Đang đóng trình duyệt ...');
      await brower.close();
      return false;
    }

    //set time stay on page after click
    await sendFoundAD(userid, projectId, adURL);
    await saveLogAD(projectId, `Đã tìm thấy url quảng cáo : ${adURL}, đang truy cập ...`);
    await setTimeDelay(delay);
    await page.waitFor(Const.timeDelay);

    //close brower
    sendCloseBrower(userid, projectId);
    saveLogAD(projectId, 'Đang đóng trình duyệt ...');
    await brower.close();
    return true;

  } catch (error) {

    console.log('error in catch block of clickSingleAD ' + error);
    await brower.close();
  }

}
/**
 * find and click many ad in one domain
 * @param {String} domain 
 * @param {Array} adURL 
 * @param {Number} delay 
 * @returns {boolean} true (found and clicked) || false (ad url not found)
 */
const clickAD = async (domain, adURL, delay, projectId, userid) => {

  let isFoundAD;

  for (let i = 0; i < adURL.length; i++) {

    isFoundAD = await clickSingleAD(domain, adURL[0], delay, projectId, userid);

    if (isFoundAD == false) {

      saveLogAD(projectId, `Không tìm thấy url quảng cáo "${adURL}" hoặc url trang chứa quảng cáo không hợp lệ`);
      sendNotFoundSingleAD(userid, projectId, adURL);

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
const searchAndSuggestSingleKeyword = async (searchTool, keyword, domain, delayTime, projectId, userid) => {

  let wasClicked = false;
  let runTime = 0;

  while (wasClicked == false) {

    runTime++;

    if (runTime > 2) return true;

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
    await page.authenticate({ username: 'lum-customer-pingo-zone-static-session-rand39484', password: '27o6ps39ddbf' });
    await sendCurrentUserAgent(userid, projectId, currentUserAgent);
    await saveLog(projectId, 'Thay đổi User Agent thành công');

    try {

      //go to google
      if (searchTool == 'google.com') {

        await page.goto('https://www.google.com/');
        await saveLog(projectId, 'https://www.google.com/');
        await sendGotoGoogle(userid, projectId);
      }
      else {

        await page.goto('https://www.google.com.vn/');
        await saveLog(projectId, 'https://www.google.com.vn/');
        await sendGotoGoogleVN(userid, projectId);
      }


      await searchByKeyWord(page, keyword);
      wasClicked = await suggestDomain(userid, projectId, page, domain);

      await setTimeDelay(delayTime);
      await page.waitFor(Const.timeDelay);

      await sendCloseBrower(userid, projectId);
      await saveLog(projectId, 'Đang đóng trình duyệt ...');
      brower.close();

    } catch (error) {

      console.log("TCL: searchAndSuggest -> error", error);
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
const searchAndSuggestMultipleKeyword = async (searchTool, keyword, domain, delayTime, projectId, userid) => {

  let isNotFoundDomain;

  for (let i = 0; i < keyword.length; i++) {

    isNotFoundDomain = await searchAndSuggestSingleKeyword(searchTool, keyword[i], domain, delayTime, projectId, userid);

    if (isNotFoundDomain) {
      saveLog(projectId, 'Không tìm thấy domain cần tìm ứng với keyword ' + keyword[i]);
      sendNotFoundDomainWithKeyword(userid, projectId, keyword[i]);
    }
  }

  return isNotFoundDomain;

}



/**
 * go to backlink, find and click main url
 * @param {*} backlink 
 * @param {*} mainURL 
 * @param {*} delay 
 * @param {*} projectId 
 * @param {*} userid 
 * @returns {boolean} true (found and clicked) || false (not found)
 */
const clickMainURLWithSingleBacklink = async (backlink, mainURL, delay, projectId, userid) => {

  //set up brower and page
  let brower = await puppeteer.launch(Const.options);
  const page = await brower.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({
    width: 1366,
    height: 768,
  });
  await page.on('console', consoleObj => console.log(consoleObj.text()));


  //start job
  try {

    //change user agent
    await sendChangingAgentBacklink(userid, projectId);
    await saveLogBacklink(projectId, 'Đang thay đổi user agent ...');
    let currentUserAgent = await changeUserAgent(page);
    await page.authenticate({ username: 'lum-customer-pingo-zone-static-session-rand39484', password: '27o6ps39ddbf' });
    await sendCurrentUserAgentBacklink(userid, projectId, currentUserAgent);
    await saveLogBacklink(projectId, 'User agent hiện tại: ' + currentUserAgent);

    //extract url
    mainURL = mainURL.replace('https://', '');
    mainURL = mainURL.replace('http://', '');
    mainURL = mainURL.split('/')[0];

    //go to urlBacklink
    //find and click mainURL
    await sendGotoDomainBacklink(userid, projectId, backlink);
    await saveLogBacklink(projectId, 'Đang truy cập: ' + backlink);

    try {

      await page.goto(backlink, { 'waitUntil': 'networkidle0' });
      await page.waitFor(5000);// in case DOM content not loaded yet
    } catch (error) {

      console.log('invalid url backlink');

      //change project status to stopped 
      //reset isForceStopped to false
      let updateProject = await mongoose.model('projectBacklinks').findById(projectId);
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();
      sendInvalidUrlBacklink(userid, projectId);

      await brower.close();
      return false;
    }



    await sendFindingBacklink(userid, projectId, backlink);
    await saveLogBacklink(projectId, `Đang tìm kiếm đường dẫn đến site chính trên trang ${backlink}`);
    let wasClicked = await page.evaluate(async (mainURL) => {

      //search all dom tree to find ad url
      let extractedDOM = await document.querySelectorAll(`a[href*="${mainURL}"]`);

      if (extractedDOM.length == 0) return false;

      try {

        await extractedDOM[0].click();
        return true;

      } catch (error) {

        console.log("error click main url in single backlink ", error)
        return false;
      }

    }, mainURL);

    if (wasClicked == false) {

      sendCloseBrower(userid, projectId);
      saveLogBacklink(projectId, 'Đang đóng trình duyệt ...');
      await brower.close();
      return false;
    }

    //found main url, acccessing
    sendFoundBacklink(userid, projectId, mainURL);
    saveLogBacklink(projectId, `Đã tìm thấy url site chính, đang truy cập ${mainURL}`);

    //click random url in this page
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    let randomURL = await clickRandomURL(page);
    sendRandomURLClicked(userid, projectId, randomURL);
    await saveLogBacklink(projectId, 'Đang click url ngẫu nhiên trên trang ...');
    await saveLogBacklink(projectId, 'URL hiện tại: ' + randomURL);

    //stay at 2nd page after random click
    await page.waitFor(3000);

    await brower.close();
    await sendCloseBrower(userid, projectId);
    await saveLogBacklink(projectId, 'Đang đóng trình duyệt ...');

    return true;

  } catch (error) {

    console.log('error in catch block of click single backlink ' + error);
    await brower.close();
  }

}


/**
 * go to each urlBacklink , find and click mainURL
 * @param {Array} urlBacklink 
 * @param {*} mainURL 
 * @param {*} delay second
 * @param {number} amount
 * @return {boolean} true(operation successed) | false(operation falsed)
 */
const clickBackLink = async (urlBacklink, mainURL, delay, amount, projectId, userid) => {

  let isFoundDomain;

  for (let i = 0; i < urlBacklink.length; i++) {

    isFoundDomain = await clickMainURLWithSingleBacklink(urlBacklink[i], mainURL, delay, projectId, userid);

    if (isFoundDomain == false) {

      saveLogBacklink(projectId, 'url backlink không hợp lệ hoặc không tìm thấy url cần view trên trang' + urlBacklink);
      sendNotFoundURLWithKeywordBacklink(userid, projectId, urlBacklink);
    }
  }

  return isFoundDomain;
}


module.exports = router;
