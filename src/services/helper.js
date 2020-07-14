const _ = require("lodash");

const clickHtmlElementById = async (page, id) => {
  await page.evaluate(async (id) => {
    const domFound = await document.querySelector(`#${id}`);
    if (domFound !== null) {
      await domFound.click();
    }
  }, id);
};

const fillToTextInput = async (
  { page, inputId = null, value },
  ...otherParams
) => {
  const [name] = otherParams;
  if (inputId === null) {
    console.log(name, "------name");
  }

  await page.evaluate(
    async ({ inputId, value, name }) => {
      let domFound = null;
      if (inputId !== null) {
        domFound = await document.querySelector(`#${inputId}`);
      } else if (name !== null) {
        domFound = await document.querySelector(`input[name="${name}"]`);
      }
      if (domFound !== null) {
        if (name !== null) {
          //   await page.type(".password", "test@gmail.com", { delay: 120 });
          console.log(name, "-----name-----domFound", domFound);
        }
        domFound.setAttribute("value", value);
      }
    },
    { inputId, value, name }
  );
};

const typeIntoInput = async ({ page, selector, value, delay = 120 }) => {
  await page.type(selector, value, { delay });
};

module.exports = { clickHtmlElementById, fillToTextInput, typeIntoInput };
