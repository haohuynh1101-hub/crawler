const puppeteer = require("puppeteer");
var Const = require("./../Const");
const helper = require("./helper");

/**
 * --------------- default config
 */
const EMAIL = "haohn19411c@st.uel.edu.vn";
const PASSWORD = "67542422";
/**
 * --------------- default config
 */

let page;
let brower;

const url =
  "https://myuel.uel.edu.vn/default.aspx?pageid=4df58a9e-3011-4470-b1f9-e9f26ccba725&ModuleID=e9bed1ce-cb07-44ed-a585-d2754b43c422";

const main = async () => {
  try {
    await _setUpCrawler();
    await _goToUrl(url);
    await page.waitFor(2000); // in case DOM content not loaded yet
    await helper.clickHtmlElementById(page, "ctl11_btLoginUIS");
    await page.waitFor(2000); // in case DOM content not loaded yet
    await helper.fillToTextInput({
      page,
      inputId: "identifierId",
      value: EMAIL,
    });
    await helper.clickHtmlElementById(page, "identifierNext");
    await page.waitFor(2000);
    await helper.typeIntoInput({
      page,
      selector: "input[name='password']",
      value: PASSWORD,
    });
    await helper.clickHtmlElementById(page, "passwordNext");

    // await helper.fillToTextInput(
    //   {
    //     page,
    //     value: PASSWORD,
    //   },
    //   "password"
    // );
  } catch (error) {
    console.log(error, "------error");
  }
};

const _setUpCrawler = async () => {
  brower = await puppeteer.launch(Const.options);
  page = await brower.newPage();

  await page.setCacheEnabled(false);
  await page.setViewport({
    width: 1366,
    height: 768,
  });
  await page.on("console", (consoleObj) => console.log(consoleObj.text()));
};

const _goToUrl = async (url) => {
  console.log(page, "-----page");
  await page.goto(url);
};

module.exports = main;
