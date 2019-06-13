var schedule = require('node-schedule');



/**
* hàm đặt lịch chạy cho function nào đó theo mốc thời gian đã định trước
* @param {DateTime} time THời gian muốn chạy function, phải có đủ các dữ liệu: phút giờ, ngày tháng
* @param {*} func hàm sẽ được khởi chạy tại thời điểm time đã định trước
*/
const setSchedule = (time, func) => {
    console.log('int there')
    // let endTime = new Date(time + 3600);
    // var j = schedule.scheduleJob({ start: time, end: endTime, rule: `${time.getSeconds()} ${time.getMinutes()} ${time.getHours()} ${time.getDate()} ${time.getMonth() + 1} ${time.getDay()}` }, func());
}

module.exports={setSchedule};