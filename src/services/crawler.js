const puppeteer = require("puppeteer");
var Const = require("./../Const");
var Infomation = require("../model/schema/infomation");
const helper = require("./helper");

/**
 * --------------- default config
 */
// const EMAIL = "haohn19411c@st.uel.edu.vn";
// const PASSWORD = "67542422";
const AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36";
const URL =
  "https://myuel.uel.edu.vn/default.aspx?pageid=4df58a9e-3011-4470-b1f9-e9f26ccba725&ModuleID=e9bed1ce-cb07-44ed-a585-d2754b43c422";
const URLTIME =
  "https://myuel.uel.edu.vn/Default.aspx?PageId=a1c64d89-9a1f-40ce-817f-6f61fa99db42";
/**
 * --------------- default config
 */

let page;
let brower;

const main = async (EMAIL, PASSWORD) => {
  try {
    console.log(EMAIL, PASSWORD, "emailllll");

    await _loginToUEL(EMAIL, PASSWORD);

    await _clickByText();
    await page.waitFor(2000);
    await _clickByThongTinCaNhan();
    await page.waitForNavigation({
      waitUntil: "networkidle0",
    });
    console.log("come to me");
    let data = await _crawlElement();
    return data;
  } catch (error) {
    console.log(error, "Loiiiii");
    // main(EMAIL, PASSWORD);
  }
};
const _loginToUEL = async (EMAIL, PASSWORD) => {
  await _setUpCrawler();
  await page.setDefaultNavigationTimeout(0);
  await _goToUrl(URL);
  await page.waitForSelector(".Loginbtnacc", {
    timeout: 300000,
    visible: true,
  });

  await helper.clickHtmlElementById(page, "ctl11_btLoginUIS");
  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });
  await helper.typeIntoInput({
    page,
    selector: "#identifierId",
    value: EMAIL,
  });
  await helper.clickHtmlElementById(page, "identifierNext");

  await page.waitFor(2000);
  await helper.typeIntoInput({
    page,
    selector: "input[name='password']",
    value: PASSWORD,
  });
  await page.waitFor(2000);
  await helper.clickHtmlElementById(page, "passwordNext");
  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });
};
// const _selectYearAndTerm = async () => {
//   await helper.clickBySelect(
//     page,
//     "portlet_3750a397-90f5-4478-b67c-a8f0a1a4060b$ctl00$ddlNamHoc",
//     "2019-2020"
//   );
//   await page.waitFor(2000);
//   await helper.clickBySelect(
//     page,
//     "portlet_3750a397-90f5-4478-b67c-a8f0a1a4060b$ctl00$ddlHocKy",
//     "HK05"
//   );
// };
const _setUpCrawler = async () => {
  brower = await puppeteer.launch(Const.options);
  page = await brower.newPage();
  await helper.changeUserAgent(page, AGENT);

  await page.setCacheEnabled(false);
  await page.setViewport({
    width: 1366,

    height: 768,
  });
  await page.on("console", (consoleObj) => console.log(consoleObj.text()));
};

const _goToUrl = async (url) => {
  await page.goto(url, { waitUntil: "load", timeout: 0 });
};
const _clickByText = async () => {
  console.log("-------- it come to link");
  const linkHandlers = await page.$x(
    "//span[contains(text(),'Thông tin cá nhân')]"
  );
  console.log("-------- link done");

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Link not found");
  }
};

const _clickByThongTinCaNhan = async () => {
  const linkHandlers = await page.$x(
    "//span[@class='rpOut rpNavigation'][./span[text()='Thông tin cá nhân']]"
  );

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Link not found");
  }
};
const _crawlElement = async () => {
  const data = await page.evaluate(async () => {
    let element = await document.querySelector("#Table3 > tbody");
    data = {
      Mssv: element
        .getElementsByTagName("tr")[3]
        .getElementsByTagName("td")[2]
        .getElementsByTagName("input")[0]
        .getAttribute("value"),
      Full_Name: element
        .getElementsByTagName("tr")[4]
        .getElementsByTagName("td")[2]
        .getElementsByTagName("input")[0]
        .getAttribute("value"),
      Birthday: element
        .getElementsByTagName("tr")[5]
        .getElementsByTagName("td")[2]
        .getElementsByTagName("input")[0]
        .getAttribute("value"),
      Place: element
        .getElementsByTagName("tr")[6]
        .getElementsByTagName("td")[2]
        .getElementsByTagName("input")[0]
        .getAttribute("value"),
      Email: element
        .getElementsByTagName("tr")[26]
        .getElementsByTagName("td")[2]
        .getElementsByTagName("input")[0]
        .getAttribute("value"),
    };
    return data;
  });
  const { Mssv, Full_Name, Birthday, Place, Email } = data;
  Infomation.create({ Mssv, Full_Name, Birthday, Place, Email });
  console.log(Mssv, Full_Name, Birthday, Place, Email);
  return data;
};

module.exports = main;
