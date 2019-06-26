var { sendCurrentURL,
  sendNotFoundURL,
  sendNextPage,
  sendRandomURLClicked
} = require('services/socket');

var clickRandomURL = require('./../services/clickRandomURL');
var {saveLog}=require('./saveLog');

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

      //wasClicked
      //true: domain found and clicked
      //false: domain not found
      wasClicked = await page.evaluate(async (domain) => {

        domain = domain.replace('https://', '');
        domain = domain.replace('http://', '');
        domain = domain.split('/')[0];
        let wasClicked = false;

        //search all dom tree to find domain
        let extractedDOM = await document.querySelectorAll('div');
        extractedDOM.forEach(async element => {

          if (element.innerText.toString().includes(domain)) {

            wasClicked = true;
            await element.querySelectorAll('a')[0].click();
          }
        });

        return wasClicked;

      }, domain);

      //if there was not any matched domain in previous page
      //search in next page  
      if (!wasClicked) {

        await sendNextPage(userid, projectId);
        await saveLog(projectId,'Không tìm thấy domain ở trang hiện tại, đang chuyển sang trang kế ...');
        await page.evaluate(async (currentPageIndex) => {
          let nextPageElement = await document.querySelectorAll(`a[href*="start=${currentPageIndex + 1}0"]`)[0];
          await nextPageElement.click();
        }, currentPageIndex)
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

      }
      else break;
    }

    if (wasClicked) {

      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

      sendCurrentURL(userid, projectId, page.url());
      await saveLog(projectId,page.url());

      await saveLog(projectId,'Đang lả lướt trên trang ...');
      await autoScroll(page);

      //click random url in page
      let randomURL = await clickRandomURL(page);
      await saveLog(projectId,'Đang click url ngẫu nhiên trên trang ...');
      await saveLog(projectId,'URL hiện tại: ' + url);
      await sendRandomURLClicked(userid, projectId, randomURL);

      return true;

    }
    else {

      sendNotFoundURL(userid, projectId);
      await saveLog(projectId, "Không tìm thấy url hoặc title khớp với truy vấn ở thiết bị đang giả lập, đang chuyển sang thiết bị khác ...");
      
      return false;

    }
  } catch (error) {

    console.log("TCL: suggestDomain -> error", error)
    return false;

  }

}
module.exports = suggestDomain;