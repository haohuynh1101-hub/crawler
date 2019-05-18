var {sendCurrentURL,sendNotFoundURL}=require('services/socket');

const clickTitle = async (page, title) => {
  try {
    await page.on('console', consoleObj => console.log(consoleObj.text()));
    let wasClicked=await page.evaluate(async (title) => {
      let wasClicked=false;
      let extractedDOM = await document.querySelectorAll('li');
      extractedDOM.forEach(async element => {
        //console.log(element.querySelectorAll('a')[0].innerText.toString())
        //console.log(element.innerText.toString().includes(title))
        if (element.innerText.toString().includes(title)) {
          wasClicked=true;
          await element.querySelectorAll('a')[0].click();
        }
      });
      return wasClicked;
    }, title);
    
    if(wasClicked){
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      sendCurrentURL(page.url());
      return  true;
    }
    else{
      sendNotFoundURL();
      return false;
    }
  } catch (error) {
    console.log("TCL: clickTitle -> error", error)
    throw error;
  }

}

module.exports = clickTitle;