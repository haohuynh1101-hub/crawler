var schedule = require('node-schedule');

module.exports = {
    setSchedule: function (time, func) {
        let endTime = new Date(time + 3600);
        var j = schedule.scheduleJob({ start: time, end: endTime, rule: `${time.getSeconds()} ${time.getMinutes()} ${time.getHours()} ${time.getDate()} ${time.getMonth()} ${time.getDay()}` }, func);
    }
}
