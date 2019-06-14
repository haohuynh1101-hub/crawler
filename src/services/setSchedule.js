var schedule = require('node-schedule');


/**
 * set schedule for specific function, run once only
 * @param {*} day 
 * @param {*} month 
 * @param {*} hour 
 * @param {*} minute 
 * @param {*} second 
 * @param {*} callback 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const setSchedule = (day, month, hour, minute, second, callback,req,res,next) => {
    console.log('inside setSchedule')
    var job = schedule.scheduleJob(`${second} ${minute} ${hour} ${day} ${month} *`, function(){
        
        callback(req,res,next);
        job.cancelNext(false);
    });
    
}

module.exports=setSchedule;