const clickLink = async (page, textlink) => {
  try {
    await page.evaluate(async (textlink) => {
      let extractedDOM = document.querySelectorAll('cite');
      for (let i = 0; i < extractedDOM.length; i++) {
        if (extractedDOM[i].innerText == textlink) {
          await extractedDOM[i].click();
        }
      }
    }, textlink);
  } catch (error) {
    console.log("TCL: clickLink -> error", error)
    throw error;
  }

}

module.exports = clickLink;