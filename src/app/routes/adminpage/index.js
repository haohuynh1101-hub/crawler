var router = require('express').Router();
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var puppeteer = require('puppeteer');
const { success, successWithNoData, errorWithMess } = require("services/returnToUser");
var Const = require("Const");
var searchByKeyWord = require('./../../../services/searchByKeyWord');
var changeUserAgent = require('./../../../services/changeUserAgent');
var setTimeDelay = require('./../../../services/setTimeDelay');
var clickRandom = require('./../../../services/clickRandom');
var suggestDomain = require('./../../../services/suggestDomain');
var getProject = require('./../../../services/getProject');
var { saveLog, saveLogBacklink, saveLogAD } = require('./../../../services/saveLog');
var clickRandomURL = require('./../../../services/clickRandomURL');
var getProxyFromAPI = require('./../../../services/getProxyFromAPI');
var setSchedule = require('./../../../services/setSchedule');
var moment = require('moment-timezone');
var formurlencoded = require('form-urlencoded').default;
var urlencode = require('urlencode');
var axios = require('axios')
var { PROXY_URL } = require('./../../../config/constants');
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
  sendGotoGoogleVN,
  sendNOTEnoughTraffic,
  sendNOTEnoughLink
} = require('services/socket');
var logger = require('log-to-file');
var path = require('path');
var LOG_FILENAME = path.dirname(require.main.filename).replace('bin','log') + `/error.log`;

/**
 * middleware that check enough links before submit links (function index)
 */
const checkEnoughLink = () => {
  
  return async (req, res, next) => {

    let { links, userid } = req.body;

    let user = await mongoose.model('users').findById(userid);

    links = links.replace('\r', '');
    links = links.split("\n");
    let inputedAmount = links.length;

    let indexAmount = user.indexAmount;

    if (indexAmount <= 0) {

      user.indexAmount = 0;
      await user.save();
      await sendNOTEnoughLink(req.body.userid, req.body.projectId);
      return res.redirect('/');
    }

    if (inputedAmount > indexAmount) {

      await sendNOTEnoughLink(req.body.userid, req.body.projectId);
      return res.redirect('/');
    }
    next();
  }
}

/**
 * middleware that check enough traffic before run tool
 */
const checkEnoughTraffic = () => {
  return async (req, res, next) => {

    let user = await mongoose.model('users').findById(req.body.userid);
    let monthlyTraffic = user.monthlyTraffic;
    if (monthlyTraffic <= 0) {

      user.monthlyTraffic = 0;
      await user.save();
      await sendNOTEnoughTraffic(req.body.userid, req.body.projectId);
      return res.redirect('/');
    }
    next();
  }
}

const getMonthlyTraffic = async (userid) => {

  try {

    let user = await mongoose.model('users').findById(userid);
    return user.monthlyTraffic;

  } catch (error) {

    logger('err in catch block get monthly traffic line 970 ' + error,LOG_FILENAME);
    return 0;
  }

}

/**
 * decrease monthly traffic of user by 1
 * @param {*} userid 
 */
const decreaseMonthlyTraffic = async (userid) => {

  try {

    let user = await mongoose.model('users').findById(userid);
    user.monthlyTraffic -= 1;
    await user.save();

  } catch (error) {

    logger('err then decrease monthly traffic ' + error,LOG_FILENAME);
  }
}

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

/**
 * clear log suggest
 */
router.post('/clearLogSuggest/:id', async (req, res) => {

  try {

    await mongoose.model('logs').deleteMany({ project: req.params.id });
    return successWithNoData(res, 'delete success');

  } catch (error) {
    console.log('err when clear suggest log: ' + error);
    return errorWithMess(res, error);
  }
})

/**
 * clear log backlink
 */
router.post('/clearLogBacklink/:id', async (req, res) => {

  try {

    await mongoose.model('logBacklinks').deleteMany({ project: req.params.id });
    return successWithNoData(res, 'delete success');

  } catch (error) {
    console.log('err when clear backlink log: ' + error);
    return errorWithMess(res, error);
  }
})

/**
 * clear log ad
 */
router.post('/clearLogAD/:id', async (req, res) => {

  try {

    await mongoose.model('logAds').deleteMany({ project: req.params.id });
    return successWithNoData(res, 'delete success');

  } catch (error) {
    console.log('err when clear ad log: ' + error);
    return errorWithMess(res, error);
  }
})

/**
 * index link
 * --> submit link
 * --> save project
 */
router.post('/indexlink', checkEnoughLink(), async (req, res) => {

  let { name, links } = req.body;

  /**
   * call api to submit link
   */
  links = links.replace('\r', '');
  links = links.split("\n");

  let encodedLinks = [];
  links.forEach(link => {
    encodedLinks.push(urlencode(link));
  });

  let requestObject = {
    apikey: 'c426d6e93ace1bf6a62f8676ce78686e',
    cmd: 'submit',
    campaign: name,
    urls: encodedLinks.join('|')
  };
  requestObject = formurlencoded(requestObject);

  let submitResult = await axios.post('http://speed-links.net/api.php', requestObject);

  //decrease index amount
  let user = await mongoose.model('users').findById(req.signedCookies.user);
  user.indexAmount -= links.length;
  await user.save();

  /**
   * save project to database
   */
  try {

    let project = await mongoose.model('projectIndex').create({
      name: name,
      links: links,
      belongTo: req.signedCookies.user
    });

  } catch (error) {
    console.log('err when save index link project ' + error);
  }

  return res.redirect('/');
});

/**
 * get index link project by id
 */
router.get('/indexlink/:id', async (req, res) => {

  try {

    let project = await mongoose.model('projectIndex').findById(req.params.id);
    console.log("TCL: project", project)
    return success(res, 'success', project);

  } catch (error) {

    console.log('err when get index link project ' + error);
    return errorWithMess(res, error);
  }

})

/**
 * delete index link project by id
 */
router.post('/deleteIndexlink/:id', async (req, res) => {

  try {

    await mongoose.model('projectIndex').findByIdAndDelete(req.params.id);
    return successWithNoData(res, 'delete success');

  } catch (error) {

    console.log('err when delete index link project ' + error);
    return errorWithMess(res, error);
  }

})

/**
 * get all role
 */
router.get('/roles', async (req, res) => {
  try {

    let role = await mongoose.model('role').find();
    return success(res, "success", role);
  } catch (error) {

    console.log('err when get all role ' + error);
    return successWithNoData(res, 'err when get all role ');
  }
});

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

/**
 * update user
 */
router.post('/users/:id', async (req, res) => {

  try {

    let { traffic, role, monthlyTraffic, indexAmount } = req.body;

    let user = await mongoose.model('users').findById(req.params.id);

    //update expired date
    let groupMaxDate = await mongoose.model('role').findById(role);
    groupMaxDate = groupMaxDate.maxUsingDate;
    user.expiredDate = moment(new Date()).add(groupMaxDate, 'day');

    //update traffic, group, index
    user.traffic = traffic;
    user.role = role;
    user.monthlyTraffic = monthlyTraffic;
    user.indexAmount = indexAmount;

    await user.save();

    return res.redirect('/')

  } catch (error) {

    console.log('err in update user info: ' + error);
    return successWithNoData(res, 'err when update user');
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

/**
 * admin page
 */
router.get('/users', async (req, res) => {

  let users = await mongoose.model('users').find().populate('role');

  let roles = await mongoose.model('role').find();

  res.render('admin', {
    users,
    roles,
    currentUser: req.signedCookies.user,
    moment: moment
  });
})

/**
 * admin page
 * stop user project
 */
router.post('/users/emergencyStop/:userid', async (req, res) => {

  try {

    await mongoose.model('projects').updateMany({ belongTo: req.params.userid }, { status: 'stopped' });

    await mongoose.model('projectBacklinks').updateMany({ belongTo: req.params.userid }, { status: 'stopped' });

    await mongoose.model('projectAds').updateMany({ belongTo: req.params.userid }, { status: 'stopped' });
    return successWithNoData(res, 'stop project success');

  } catch (error) {
    console.log('err when emergency stop: ' + error);
    return errorWithMess(res, error);
  }
});

/**
 * create user
 */
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

/**
 * renew user
 */
router.post('/users/renew/:id', async (req, res) => {

  try {

    //get user info from database
    let userid = req.params.id;
    let user = await mongoose.model('users').findById(userid);

    //get user max using day of user
    let roleid = user.role;
    let groupMaxDate = await mongoose.model('role').findById(roleid);
    groupMaxDate = groupMaxDate.maxUsingDate;

    //renew
    user.expiredDate = moment(new Date()).add(groupMaxDate, 'day');

    await user.save();

    return success(res, "Success!!", user);

  } catch (error) {

    console.log('err when renew user: ' + error);
    return successWithNoData(res, 'err when renew user ');
  }

})

/**
 * delete user
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    await mongoose.model('users').findOneAndDelete({ _id: req.params.id });
    return res.redirect('/users')
  } catch (error) {
    console.log(error);
    next(error)
  }
})

/**
 * create new group 
 * body:
 * name
 * canSuggest
 * canBacklink
 * canClickAD
 * canManageUser
 * maxDate
 * maxProject
 */
router.post('/groupUsers', async function (req, res, next) {

  try {

    let insert = {
      name: req.body.groupName,
      canSuggest: (req.body.canSuggest == 'true') ? true : false,
      canBacklink: (req.body.canBacklink == 'true') ? true : false,
      canClickAD: (req.body.canClickAD == 'true') ? true : false,
      canManageUser: (req.body.canManageUser == 'true') ? true : false,
      canIndex: (req.body.canIndex == 'true') ? true : false,
      maxUsingDate: req.body.maxDate,
      maxProject: req.body.maxProject
    }
    await mongoose.model('role').create(insert);
    return res.redirect('/users');
  } catch (error) {

    console.log("err in create new group router ", error)
    res.redirect('/');
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

    let numberOfProject = await mongoose.model('projectAds').find({ belongTo: req.signedCookies.user }).countDocuments();
    let maxProject = await mongoose.model('users').findById(req.signedCookies.user).populate('role');
    maxProject = maxProject.role.maxProject;

    if (numberOfProject < maxProject) {

      let projects = await mongoose.model('projectAds').create({ ...req.body, adURL: JSON.parse(req.body.adURL), belongTo: req.signedCookies.user, status: 'not started' });

      return success(res, "Success!!", projects);
    }

    return successWithNoData(res, "reached max project");

  } catch (error) {

    console.log("save new ad project err ", error)

    return successWithNoData(res, "err when save new ad project ");
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

    if (updateProject) {
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();
      //send reload page socket
      await sendStopAD(userid, projectId);
    }
  }
}

const clickADTask = async (req, res) => {

  return new Promise(async (resolve, reject) => {

    try {

      let { projectId, userid } = req.body;

      //set status of project to "running"
      let updateProject = await mongoose.model('projectAds').findById(projectId);
     
      updateProject.status = 'running';
      updateProject.save();

      //main process
      while(true) {

        let { domain, adURL, delay, isForceStop } = await mongoose.model('projectAds').findById(projectId);

        if (isForceStop) throw new Error('Your ad task is forced to stopped by user !!!');

        let isSuccessed = await clickAD(domain, adURL, delay, projectId, userid);

        //invalid ad url/domain --> exit
        if (isSuccessed == false) {

          saveLogAD(projectId, 'Không tìm thấy bất kì url quảng cáo nào trùng khớp, vui lòng kiểm tra lại !!!');
          sendNotFoundAD(userid, projectId);
          break;
        }

        //out of traffic --> exit
        let monthlyTraffic = await getMonthlyTraffic(userid);
        if (monthlyTraffic <= 0) {

          await sendNOTEnoughTraffic(userid, projectId);
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
router.post('/clickAd', checkEnoughTraffic(), async (req, res, next) => {

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

    let { adURL, domain, delay, amount, name } = req.body;

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

    let result = await mongoose.model('projectAds').findById(req.params.id).populate({
      path: 'log',
      options: {
        limit: 20,
        sort: { _id: -1 }
      }
    });

    res.json(result);

  } catch (error) {
    logger('err line 825: '+error,LOG_FILENAME);
    console.log('err get ad project info: ' + error);
  }

})


/**
 * save new suggest project
 */
router.post('/addproject', async (req, res) => {
  try {

    let numberOfProject = await mongoose.model('projects').find({ belongTo: req.signedCookies.user }).countDocuments();
    let maxProject = await mongoose.model('users').findById(req.signedCookies.user).populate('role');
    maxProject = maxProject.role.maxProject;

    if (numberOfProject < maxProject) {

      let projects = await mongoose.model('projects').create({ ...req.body, keyword: JSON.parse(req.body.keyword), belongTo: req.signedCookies.user, status: 'not started' });

      return success(res, "Success!!", projects);
    }

    return successWithNoData(res, "reached max project!!");

  } catch (error) {

    console.log("TCL: error when save new suggest project ", error)
    return successWithNoData(res, "err when save new suggest project");
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

    let project = await mongoose.model('projects').findById(req.params.id).populate({
      path: 'log',
      options: {
        limit: 20,
        sort: { _id: -1 }
      }
    });

    res.json(project);

  } catch (error) {
    logger('err line 899: '+error,LOG_FILENAME)
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


/**
 * homepage
 */
router.get('/', returnAdminpage(), async function (req, res, next) {
  try {
    let user = await mongoose.model('users').findById(req.signedCookies.user)
    let allProject = await mongoose.model('projects').find({ belongTo: user._id });
    let allBackLinkProject = await mongoose.model('projectBacklinks').find({ belongTo: user._id });
    let allAdProject = await mongoose.model('projectAds').find({ belongTo: user._id });
    let allIndexProject = await mongoose.model('projectIndex').find({ belongTo: user._id });
    let role = await mongoose.model('role').findOne({ _id: user.role });
    let traffic = user.traffic;

    if (isExpiredUser(user) == false)

      res.render('adminpage', {
        allProject,
        allBackLinkProject,
        allAdProject,
        allIndexProject,
        role,
        traffic,
        monthlyTraffic: user.monthlyTraffic,
        indexAmount: user.indexAmount
      });

    else
      res.render('login', { isExpired: true });

  } catch (error) {

    console.log("render admin page error: ", error)
    next(error);
  }


});



//
/**
 * save new backlink project
 * req.body:
 * urlBacklink: Array
 * mainURL
 * amount
 * name
 */
router.post('/saveProjectBacklink', async (req, res) => {

  try {

    let numberOfProject = await mongoose.model('projectBacklinks').find({ belongTo: req.signedCookies.user }).countDocuments();
    let maxProject = await mongoose.model('users').findById(req.signedCookies.user).populate('role');
    maxProject = maxProject.role.maxProject;

    if (numberOfProject < maxProject) {

      let projects = await mongoose.model('projectBacklinks').create({ ...req.body, urlBacklink: JSON.parse(req.body.urlBacklink), belongTo: req.signedCookies.user, status: 'not started' });

      return success(res, "Success!!", projects);
    }

    return successWithNoData(res, "reached max project");

  } catch (error) {

    console.log("save new project backlink err ", error)

    return successWithNoData(res, 'err when save new backlin project');
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

    let { urlBacklink, mainURL, delay, amount, name } = req.body;

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

    let projectInfo = await mongoose.model('projectBacklinks').findById(req.params.id).populate({
      path: 'log',
      options: {
        limit: 20,
        sort: { _id: -1 }
      }
    });

    res.json(projectInfo);

  } catch (error) {
    logger('err line 1059: '+error,LOG_FILENAME);
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

    logger('err in catch block backlinkTaskContainer line 1066: '+error,LOG_FILENAME);

    //user stop
    //change project status to stopped 
    //reset isForceStopped to false
    let { projectId, userid } = req.body;
    let updateProject = await mongoose.model('projectBacklinks').findById(projectId);

    if (updateProject) {
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();

      //send reload page socket
      await sendStopBacklink(userid, projectId);
    }

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
      while(true) {

        //get project info
        let { urlBacklink, mainURL, delay, isForceStop } = await mongoose.model('projectBacklinks').findById(projectId);

        if (isForceStop) throw new Error('Your backlink task is forced to stopped by user !!!');

        let isSuccessed = await clickBackLink(urlBacklink, mainURL, delay, amount, projectId, userid);

        //invalid backlink/domain --> exit
        if (isSuccessed == false) {

          sendNotFoundBacklink(userid, projectId);
          saveLogBacklink(projectId, 'Không tìm thấy site chính trong backlink , vui lòng thử lại sau !!!');
          break;
        }

        
      }

      //done task
      //set status of project to "stopped"
      //reset is force stop to fasle
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      updateProject.save();
      await sendStopBacklink(userid, projectId);

      res.send('ok');

    } catch (error) {

      logger('err line 1139: ' + error,LOG_FILENAME)
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
router.post('/backlink', checkEnoughTraffic(), async (req, res, next) => {

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

      logger('error when change backlink project status  :'+error,LOG_FILENAME);
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

    //change project status to stopped 
    //reset isForceStopped to false
    let { projectId, userid } = req.body;
    let updateProject = await getProject(projectId);

    if (updateProject) {
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();

      //send reload page socket
      await sendStopSuggest(userid, projectId);
    }
    
  } catch (error) {

    logger('err line 1233: ' + JSON.stringify(error),LOG_FILENAME);
    //change project status to stopped 
    //reset isForceStopped to false
    let { projectId, userid } = req.body;
    let updateProject = await getProject(projectId);

    if (updateProject) {
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();

      //send reload page socket
      await sendStopSuggest(userid, projectId);
    }

  }
}



const suggestTask = async (req, res) => {

  return new Promise(async (resolve, reject) => {

    try {

      let { projectId, userid } = req.body;

      //set status of project to "running"
      let updateProject = await getProject(projectId);
      updateProject.status = 'running';
      await updateProject.save();

      //main process 
      while(true) {

        let { keyword, domain, delay, isForceStop, searchTool } = await getProject(projectId);

        if (isForceStop) throw new Error('Your suggest task is forced to stopped by user !!!');

        let isCrashed = await searchAndSuggestMultipleKeyword(searchTool, keyword, domain, delay, projectId, userid);

        //all keyword invalid --> exit
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

      logger('err line 1306: '+JSON.stringify(error),LOG_FILENAME);
      //change project status to stopped 
      //reset isForceStopped to false
      let { projectId, userid } = req.body;
      let updateProject = await getProject(projectId);

      if (updateProject) {
        updateProject.status = 'stopped';
        updateProject.isForceStop = false;
        await updateProject.save();

        //send reload page socket
        await sendStopSuggest(userid, projectId);
      }

      return reject(error);
    }
  });
}

/**
 * stop project suggest
 */
router.get('/stopSuggest/:id', async (req, res) => {

  //query old project info
  let oldProject = await mongoose.model('projects').findById(req.params.id);
  let newProjectInfo = {
    keyword: oldProject.keyword,
    isForceStop: false,
    domain: oldProject.domain,
    delay: oldProject.delay,
    amount: oldProject.amount,
    name: oldProject.name,
    searchTool: oldProject.searchTool,
    belongTo: oldProject.belongTo,
    status: 'stopped'
  };

  //delete old project info
  await mongoose.model('projects').findByIdAndDelete(req.params.id);

  //create new project with same info
  await mongoose.model('projects').create({ ...newProjectInfo });

  return res.redirect('/');
});

/**
 * stop project ad
 */
router.get('/stopAD/:id', async (req, res) => {

  //query old project info
  let oldProject = await mongoose.model('projectAds').findById(req.params.id);
  let newProjectInfo = {
    adURL: oldProject.adURL,
    isForceStop: false,
    domain: oldProject.domain,
    delay: oldProject.delay,
    amount: oldProject.amount,
    name: oldProject.name,
    belongTo: oldProject.belongTo,
    status: 'stopped'
  };

  //delete old project info
  await mongoose.model('projectAds').findByIdAndDelete(req.params.id);

  //create new project with same info
  await mongoose.model('projectAds').create({ ...newProjectInfo });

  return res.redirect('/');
});

/**
 * stop project backlink
 */
router.get('/stopBacklink/:id', async (req, res) => {

  //query old project info
  let oldProject = await mongoose.model('projectBacklinks').findById(req.params.id);
  let newProjectInfo = {
    urlBacklink: oldProject.urlBacklink,
    isForceStop: false,
    mainURL: oldProject.mainURL,
    delay: oldProject.delay,
    amount: oldProject.amount,
    name: oldProject.name,
    belongTo: oldProject.belongTo,
    status: 'stopped'
  };

  //delete old project info
  await mongoose.model('projectBacklinks').findByIdAndDelete(req.params.id);

  //create new project with same info
  await mongoose.model('projectBacklinks').create({ ...newProjectInfo });

  return res.redirect('/');
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
router.post('/suggest', checkEnoughTraffic(), async (req, res, next) => {

  try {

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
  } catch (error) {

    logger('err line 1462: '+error,LOG_FILENAME);
    //change project status to stopped 
    //reset isForceStopped to false
    let { projectId, userid } = req.body;
    let updateProject = await getProject(projectId);

    if (updateProject) {
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();

      //send reload page socket
      await sendStopSuggest(userid, projectId);
    }
    console.log('project deleted');
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


let numberOfInvalidAD = 0;
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

  /**
   * flag check stop signal from user
   * change project status to stopped 
   * reset isForceStopped to false
   */
  let { isForceStop, status } = await mongoose.model('projectAds').findById(projectId);
  if (isForceStop) {

    let updateProject = await mongoose.model('projectAds').findById(projectId);
    updateProject.status = 'stopped';
    updateProject.isForceStop = false;
    await updateProject.save();
    //send reload page socket
    await sendStopAD(userid, projectId);
    return true;
  }
  if (status === 'stopped') return true;


  /**
   * setup brower and page
   */
  let brower = await puppeteer.launch(Const.options);
  const page = await brower.newPage();
  await page.authenticate({ username: 'anhhungan', password: '035112-590e0d-280bb4-8beb39-83cde4' });
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

      await page.goto(domain, { timeout: 300000, waitUntil: 'domcontentloaded' });
      await page.waitFor(5000);// in case DOM content not loaded yet
      numberOfInvalidAD = 0;
      console.log('connect proxy success')

    } catch (error) {

      logger('err in catch block click singlead line 1299 ' + error.LOG_FILENAME);

      // //change project status to stopped 
      // //reset isForceStopped to false
      // let updateProject = await mongoose.model('projectAds').findById(projectId);
      // updateProject.status = 'stopped';
      // updateProject.isForceStop = false;
      // await updateProject.save();
      // await sendStopAD(userid, projectId);

      await brower.close();

      console.log('connect proxy faile, retry: ' + numberOfInvalidAD)

      numberOfInvalidAD++;
      console.log("TCL: clickMainURLWithSingleBacklink -> numberInvalidBacklink", numberInvalidBacklink)

      if (numberOfInvalidAD >= 10) return false;

      await clickSingleAD(domain, adURL, delay, projectId, userid);

    }


    await page.waitForSelector(`a[href*="${adURL}"]`,{ timeout: 300000, visible: true });
    let wasClicked = await page.evaluate(async (adURL) => {

      //search all dom tree to find ad url
      let extractedDOM = await document.querySelectorAll(`a[href*="${adURL}"]`);

      if (extractedDOM.length == 0) return false;

      try {

        await extractedDOM[0].setAttribute('target', '');
        await extractedDOM[0].click();
        return true;

      } catch (error) {

        logger("error click single ad "+ error,LOG_FILENAME)
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

    logger('error in catch block of clickSingleAD line 1234 ' + error,LOG_FILENAME);
    await brower.close();
    return false;
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
  let numberOfInvalidDomain = 0;

  for (let i = 0; i < adURL.length; i++) {

    isFoundAD = await clickSingleAD(domain, adURL[0], delay, projectId, userid);

    if (isFoundAD == false) {

      numberOfInvalidDomain++;
      saveLogAD(projectId, `Không tìm thấy url quảng cáo "${adURL}" hoặc url trang chứa quảng cáo không hợp lệ`);
      sendNotFoundSingleAD(userid, projectId, adURL);

    }
  }

  if (numberOfInvalidDomain >= adURL.length) return false;

  await decreaseMonthlyTraffic(userid);

  return true;
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

    /**
  * flag check stop signal from user
  * change project status to stopped 
  * reset isForceStopped to false
  */
    let { isForceStop, status } = await mongoose.model('projects').findById(projectId);
    if (isForceStop) {

      let updateProject = await mongoose.model('projects').findById(projectId);
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();
      //send reload page socket
      await sendStopSuggest(userid, projectId);
      return true;
    }
    if (status === 'stopped') return true;

    runTime++;

    if (runTime > 10) return true;

    /**
     * set up brower and page
     */
    let brower = await puppeteer.launch(Const.options);
    const page = await brower.newPage();
    await page.authenticate({ username: 'anhhungan', password: '035112-590e0d-280bb4-8beb39-83cde4' });
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

      if(wasClicked){
        await setTimeDelay(delayTime);
        await page.waitFor(Const.timeDelay);
      }

      await sendCloseBrower(userid, projectId);
      await saveLog(projectId, 'Đang đóng trình duyệt ...');
      await brower.close();


    } catch (error) {

      logger("TCL: searchAndSuggest -> error" + error, LOG_FILENAME);
      await brower.close();
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
  let numberOfInvalidDomain = 0;

  for (let i = 0; i < keyword.length; i++) {

    //out of traffic --> exit
    let monthlyTraffic = await getMonthlyTraffic(userid);
    await saveLog(projectId,'Traffic available: '+monthlyTraffic);
    if (monthlyTraffic <= 0) {

      await sendNOTEnoughTraffic(userid, projectId);
      return true;
    }

    /**
  * flag check stop signal from user
  * change project status to stopped 
  * reset isForceStopped to false
  */
    let { isForceStop, status } = await mongoose.model('projects').findById(projectId);
    if (isForceStop) {

      let updateProject = await mongoose.model('projects').findById(projectId);
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();
      //send reload page socket
      await sendStopSuggest(userid, projectId);
      return false;
    }
    if (status == 'stopped') return false;

    isNotFoundDomain = await searchAndSuggestSingleKeyword(searchTool, keyword[i], domain, delayTime, projectId, userid);
    
    if (isNotFoundDomain == true) {
      numberOfInvalidDomain++;
      await saveLog(projectId, 'Không tìm thấy domain cần tìm ứng với keyword ' + keyword[i]);
      sendNotFoundDomainWithKeyword(userid, projectId, keyword[i]);

    } else if (isNotFoundDomain == false) { //found and clicked 1 domain
      await decreaseMonthlyTraffic(userid);

    } else {
      await logger('err line 1824 -> isNotFoundDomain: ' + isNotFoundDomain, LOG_FILENAME);
    }
  }

  if (numberOfInvalidDomain >= keyword.length) return true;
  
  return false;
}


let numberInvalidBacklink = 0;
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

  /**
   * flag check stop signal from user
   * change project status to stopped 
   * reset isForceStopped to false
   */
  let { isForceStop, status } = await mongoose.model('projectBacklinks').findById(projectId);
  if (isForceStop) {

    let updateProject = await mongoose.model('projectBacklinks').findById(projectId);
    updateProject.status = 'stopped';
    updateProject.isForceStop = false;
    await updateProject.save();
    //send reload page socket
    await sendStopBacklink(userid, projectId);
    return false;
  }
  if (status === 'stopped') return false;

  /**
   * setup brower and page
   */

  let brower = await puppeteer.launch(Const.options);
  const page = await brower.newPage();
  await page.authenticate({ username: 'anhhungan', password: '035112-590e0d-280bb4-8beb39-83cde4' });
  await page.setCacheEnabled(false);
  await page.setViewport({
    width: 1366,
    height: 768,
  });
  await page.on('console', consoleObj => console.log(consoleObj.text()));


  /**
   * start job
   */
  try {

    //change user agent
    await sendChangingAgentBacklink(userid, projectId);
    await saveLogBacklink(projectId, 'Đang thay đổi user agent ...');
    let currentUserAgent = await changeUserAgent(page);
    await sendCurrentUserAgentBacklink(userid, projectId, currentUserAgent);
    await saveLogBacklink(projectId, 'User agent hiện tại: ' + currentUserAgent);

    //extract url
    mainURL = mainURL.replace('https://', '');
    mainURL = mainURL.replace('http://', '');
    mainURL = mainURL.split('/')[0];

    //go to urlBacklink
    await sendGotoDomainBacklink(userid, projectId, backlink);
    await saveLogBacklink(projectId, 'Đang truy cập: ' + backlink);


    /// try to access backlink, wait maximum 300s
    /// if can not access, recursive maximum 10 times
    try {

      await page.goto(backlink, { timeout: 300000, waitUntil: 'domcontentloaded' });

      await page.waitFor(5000);// in case DOM content not loaded yet
      numberInvalidBacklink = 0;

    } catch (error) {

      logger('invalid url backlink in catch block clickMainURLWithSingleBacklink line 1959: '+error,LOG_FILENAME);

      await brower.close();

      numberInvalidBacklink++;

      if (numberInvalidBacklink >= 10) return false;

      await clickMainURLWithSingleBacklink(backlink, mainURL, delay, projectId, userid)
    }


    await sendFindingBacklink(userid, projectId, backlink);
    await saveLogBacklink(projectId, `Đang tìm kiếm đường dẫn đến site chính trên trang ${backlink}`);

    /// search for main url
    await page.waitForSelector(`a[href*="${mainURL}"]`,{ timeout: 300000, visible: true });
    let wasClicked = await page.evaluate(async (mainURL) => {

      //search all dom tree to find main url
      let extractedDOM = await document.querySelectorAll(`a[href*="${mainURL}"]`);

      //not found main url--> exit 
      if (extractedDOM.length == 0) return false;

      //found main url, try to click
      try {
        await extractedDOM[0].setAttribute('target', '');
        await extractedDOM[0].click();
        return true;

      } catch (error) {

        logger("error click main url in single backlink "+ error,LOG_FILENAME);
        return false;
      }

    }, mainURL);

    if (wasClicked == false) {

      sendCloseBrower(userid, projectId);
      saveLogBacklink(projectId, 'Đang đóng trình duyệt ...');
      await brower.close();
      return false;
    }

    /// found main url, acccessing
    sendFoundBacklink(userid, projectId, mainURL);
    saveLogBacklink(projectId, `Đã tìm thấy url site chính, đang truy cập ${mainURL}`);

    // delay in main page
    await setTimeDelay(delay);
    await page.waitFor(Const.timeDelay);

    await brower.close();
    await sendCloseBrower(userid, projectId);
    await saveLogBacklink(projectId, 'Đang đóng trình duyệt ...');

    return true;

  } catch (error) {

    logger('error in catch block of click single backlink line 2026: ' + error,LOG_FILENAME);
    await brower.close();
    return false;
  }

}
function dumpError(err) {
  if (typeof err === 'object') {
    if (err.message) {
      console.log('\nMessage: ' + err.message)
    }
    if (err.stack) {
      console.log('\nStacktrace:')
      console.log('====================')
      console.log(err.stack);
    }
  } else {
    console.log('dumpError :: argument is not an object');
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
  let numberOfInvalidDomain = 0;

  for (let i = 0; i < urlBacklink.length; i++) {

    //out of traffic --> exit
    let monthlyTraffic = await getMonthlyTraffic(userid);
    await saveLogBacklink(projectId,'available traffic: '+monthlyTraffic);
    if (monthlyTraffic <= 0) {

      await sendNOTEnoughTraffic(userid, projectId);
      return false;
    }

    isFoundDomain = await clickMainURLWithSingleBacklink(urlBacklink[i], mainURL, delay, projectId, userid);
    
    if (isFoundDomain == false) {
      numberOfInvalidDomain++;
      saveLogBacklink(projectId, 'url backlink không hợp lệ hoặc không tìm thấy url cần view trên trang' + urlBacklink[i]);
      sendNotFoundURLWithKeywordBacklink(userid, projectId, urlBacklink);

    } else if (isFoundDomain == true) {//found and clicked 1 domain
      await decreaseMonthlyTraffic(userid);

    } else {
      logger('err line 2015, isFoundDomain: ' + isFoundDomain,LOG_FILENAME);
    }
  }

  if (numberOfInvalidDomain >= urlBacklink.length) return false;

  return true;
}

module.exports = router;
