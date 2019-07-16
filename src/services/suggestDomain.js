var {
  sendCurrentURL,
  sendNotFoundURL,
  sendNextPage,
  sendRandomURLClicked,
  sendDeadProxy
} = require('services/socket');

var clickRandomURL = require('./../services/clickRandomURL');
var { saveLog } = require('./saveLog');

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * find and click domain base on google search result (find maximum 10 first pages)
 * @param {*} userid 
 * @param {*} page 
 * @param {*} domain 
 * @return {boolean} true (found and clicked) || false (domain not found)
 */
const suggestDomain = async (userid, projectId, page, domain) => {

  try {

    let wasClicked;

    for (let currentPageIndex = 0; currentPageIndex < 9; currentPageIndex++) {

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

      //wasClicked
      //true: domain found and clicked
      //false: domain not found
      await page.waitFor(7000);
      wasClicked = await page.evaluate(async (domain) => {

        domain = domain.split('/');
        domain = domain[0] + "//" + domain[2];

        let wasClicked = false;

        let myDOM = await document.querySelectorAll(`a[href*="${domain}"]`);

        if (myDOM.length > 0) {

          wasClicked = true;
          await myDOM[0].click();
        }

        return wasClicked;

      }, domain);

      /**
       * flag check stop signal from user
       * change project status to stopped 
       * reset isForceStopped to false
       */
      let flag = await mongoose.model('projects').findById(projectId);
      if (flag.isForceStop) {

        let updateProject = await mongoose.model('projects').findById(projectId);
        updateProject.status = 'stopped';
        updateProject.isForceStop = false;
        await updateProject.save();
        //send reload page socket
        await sendStopSuggest(userid, projectId);
        return true;
      }
      if (flag.status === 'stopped') return true;


      //if there was not any matched domain in previous page
      //search in next page  
      if (!wasClicked) {
        console.log('next page')

        let nextpageURL = await page.evaluate(async (currentPageIndex) => {

          let nextPageElement = await document.querySelectorAll(`a[href*="start=${currentPageIndex + 1}0"]`)[0];

          let nextpageURL = nextPageElement.getAttribute('href');

          return nextpageURL;

        }, currentPageIndex);

        await sendNextPage(userid, projectId);
        await saveLog(projectId, 'Không tìm thấy domain ở trang hiện tại, đang chuyển sang trang kế ...');

        await page.goto('https://www.google.com' + nextpageURL);

        await page.waitFor(5000);

      }
      else break;
    }

    /**
     * flag check stop signal from user
     * change project status to stopped 
     * reset isForceStopped to false
     */
    let flag2 = await mongoose.model('projects').findById(projectId);
    if (flag2.isForceStop) {

      let updateProject = await mongoose.model('projects').findById(projectId);
      updateProject.status = 'stopped';
      updateProject.isForceStop = false;
      await updateProject.save();
      //send reload page socket
      await sendStopSuggest(userid, projectId);
      return true;
    }
    if (flag2.status === 'stopped') return true;


    if (wasClicked) {

      await page.waitForNavigation({ timeout: 300000, waitUntil: 'domcontentloaded' });

      sendCurrentURL(userid, projectId, page.url());
      await saveLog(projectId, page.url());

      await saveLog(projectId, 'Đang lả lướt trên trang ...');
      await autoScroll(page);

      //click random url in page
      let randomURL = await clickRandomURL(page);
      await saveLog(projectId, 'Đang click url ngẫu nhiên trên trang ...');
      await saveLog(projectId, 'URL hiện tại: ' + randomURL);
      await sendRandomURLClicked(userid, projectId, randomURL);

      return true;

    }
    else {

      sendNotFoundURL(userid, projectId);
      await saveLog(projectId, "Không tìm thấy url hoặc title khớp với truy vấn ở thiết bị đang giả lập, đang chuyển sang thiết bị khác ...");

      return false;

    }
  } catch (error) {

    console.log("TCL: suggestDomain -> error", error);
    await sendDeadProxy(userid, projectId);
    await saveLog(projectId, 'IP die, đang đổi ip khác');

    return false;

  }

}
module.exports = suggestDomain;