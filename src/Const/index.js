var fs=require('fs');
module.exports = {
    options: {
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox','--proxy-server=138.197.49.55:50000']
    },
    //listProxy: fs.readFileSync('src/app/public/proxy.txt').toString().split("\n"),
    timeDelay:10000,
    typingSpeed:50
}