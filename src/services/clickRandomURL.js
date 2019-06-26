
/**
 * click random a url in a page
 * @param {*} page 
 * @return {*} url that clicked
 */
const clickRandomURL = async (page) => {

    try {

        let url = await page.evaluate(async () => {

            let extractedDOM = await document.querySelectorAll('a[href]:not([href="#"])');
            let randomIndex = Math.floor(Math.random() * extractedDOM.length) + 0;

            await extractedDOM[randomIndex].click();
            return extractedDOM[randomIndex].getAttribute('href');
        });

        return url;

    } catch (error) {

        console.log('err in clickRandomURL '+error);
        return page.url();
    }

}

module.exports = clickRandomURL;