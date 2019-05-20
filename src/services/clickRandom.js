var expect = require('expect-puppeteer')
const clickRandom = async (page) => {
    console.log('click func')

    try {
        await page.evaluate(async () => {

            let extractedDOM = await document.querySelectorAll('h3');
            extractedDOM.forEach(async element => {
                let dom = element.innerText.toString();
                console.log(typeof (dom))
                let con = 'Thông Cầu Cống Nghẹt Tại TPHCM | Có Mặt Sau 10 Phút‎‎';
                console.log(dom);
                console.log(dom.localeCompare('Thông Cầu Cống Nghẹt Tại TPHCM | Có Mặt Sau 10 Phút‎‎') == 0);
                if (element.innerText.toString().localeCompare('[HOT] Rút Hầm Cầu giá rẻ tại các quận TPHCM - Gọi: 0987.822.770‎‎') == 0) await element.click();
            });
            // console.log('before change: ' + extractedDOM.length)
            // if (extractedDOM.length == 0) {

            //     extractedDOM = await document.querySelectorAll('h3.ellip');
            //     console.log('after change: '+extractedDOM.length);
            // }

            // var patient = await extractedDOM[Math.floor(Math.random() * extractedDOM.length)];
            // console.log("TCL: clickRandom -> patient", patient)
            // patient.click();


        });
    } catch (error) {
        console.log("TCL: clickRandom -> error", error)
        throw error;
    }

}

module.exports = clickRandom;