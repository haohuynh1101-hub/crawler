var {sendCurrentURL,sendNotFoundURL}=require('services/socket');

const suggestDomain = async (socketID,page, domain) => {
  try {
    await page.on('console', consoleObj => console.log(consoleObj.text()));
    let wasClicked=await page.evaluate(async (domain) => {
      let wasClicked=false;
      let extractedDOM = await document.querySelectorAll('div');
      extractedDOM.forEach(async element => {
        //console.log(element.querySelectorAll('a')[0].innerText.toString())
        //console.log(element.innerText.toString().includes(title))
        if (element.innerText.toString().includes(domain)) {
          wasClicked=true;
          await element.querySelectorAll('a')[0].click();
        }
      });
      return wasClicked;
    }, domain);
    
    if(wasClicked){
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      sendCurrentURL(socketID,page.url());
      return  true;
    }
    else{
      sendNotFoundURL(socketID);
      return false;
    }
  } catch (error) {
    console.log("TCL: clickTitle -> error", error)
    throw error;
  }

}

module.exports = suggestDomain;