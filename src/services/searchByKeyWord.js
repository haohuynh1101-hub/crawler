var Const = require("Const");

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
        await page.waitForNavigation({ waitUntil: 'load' });
    } catch (error) {
        console.log("TCL: searchByKeyWord -> error", error)
        throw error;
    }
}

module.exports = searchByKeyWord;
