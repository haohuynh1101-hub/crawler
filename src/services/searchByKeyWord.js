var Const=require("Const");
const searchByKeyWord = async (page,keyword) => {
    try {
        await page.type('.gLFyf, .gsfi', keyword, { delay: Const.typingSpeed });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({waitUntil: 'load'});
    } catch (error) {
        console.log("TCL: searchByKeyWord -> error", error)
        throw error;
    }
}

module.exports = searchByKeyWord;
