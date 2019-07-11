var Const = require("Const");

/**
 * check if search result stuck by google capcha
 * @param {*} page 
 */
const isCapchaStuck = async (page) => {

    let isStuck = false;
    await page.waitFor(7000);
    isStuck = await page.evaluate(async () => {

        let capchaID = await document.querySelectorAll('#recaptcha-token');
        if (capchaID.length > 0) return true;
    });

    return isStuck;
}



/**
 * after go to gooole in previous step
 * type keyword in google search box
 * press enter
 * @param {*} page 
 * @param {*} keyword 
 */
const searchByKeyWord = async (page, keyword) => {

    try {

        await page.type('[name="q"]', keyword, { delay: Const.typingSpeed });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    } catch (error) {
        console.log("TCL: searchByKeyWord -> error", error)
        throw error;
    }
}

module.exports = searchByKeyWord;
