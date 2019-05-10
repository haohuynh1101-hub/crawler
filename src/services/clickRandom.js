const clickRandom = async (page) => {
    try {
        await page.evaluate(async () => {
            let extractedDOM = document.querySelectorAll('cite.UdQCqe');
            var patient = extractedDOM[Math.floor(Math.random() * extractedDOM.length)];
            patient.click();
        });
    } catch (error) {
        console.log("TCL: clickRandom -> error", error)
        throw error;
    }

}

module.exports = clickRandom;