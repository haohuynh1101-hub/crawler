var { sendCurrentURL, sendNotFoundURL, sendNextPage } = require('services/socket');
async function autoScroll(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}

/**
 * find and click domain base on google search result (find maximum 10 first pages)
 * @param {*} socketID 
 * @param {*} page 
 * @param {*} domain 
 * @return {boolean} true (found and clicked) || false (domain not found)
 */
const suggestDomain = async (socketID,projectId, page, domain) => {
  
  try {

    // await page.on('console', consoleObj => console.log(consoleObj.text()));
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

        await sendNextPage(socketID,projectId);
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
      sendCurrentURL(socketID,projectId, page.url());
      await autoScroll(page);
      return true;

    }
    else {

      sendNotFoundURL(socketID,projectId);
      return false;

    }
  } catch (error) {

    console.log("TCL: suggestDomain -> error", error)
    throw error;

  }

}
module.exports = suggestDomain;