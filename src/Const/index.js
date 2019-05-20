var fs=require('fs');
module.exports = {
    options: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    //listProxy: fs.readFileSync('src/app/public/proxy.txt').toString().split("\n"),
    timeDelay:10000,
    typingSpeed:50
}