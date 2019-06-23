var fs=require('fs');
module.exports = {
    options: {
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox','--proxy-server=zproxy.lum-superproxy.io:22225']
    },
    //listProxy: fs.readFileSync('src/app/public/proxy.txt').toString().split("\n"),
    timeDelay:10000,
    typingSpeed:50
}