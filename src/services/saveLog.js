var mongoose = require('mongoose');
var moment = require('moment-timezone');
/**
 * save log   suggest 
 * @param {*} projectId 
 * @param {*} message 
 */
const saveLog = async (projectId, message) => {

    let timeLog=moment().utcOffset('+7');

    let log=`${timeLog.hour()}:${timeLog.minute()}:${timeLog.second()}-${timeLog.date()}/${timeLog.month()} `+`${message}`;


    //save log to document logs
    let newLog = await mongoose.model('logs').create({
        message: log,
        project: projectId
    })

    //push log to document projects
    let updateProject = await mongoose.model('projects').findById(projectId);

    await updateProject.log.push(newLog._id);
    await updateProject.save();
}

/**
 * save log backlink
 * @param {*} projectId 
 * @param {*} message 
 */
const saveLogBacklink = async (projectId, message) => {

    let timeLog=moment().utcOffset('+7');

    let log=`${timeLog.hour()}:${timeLog.minute()}:${timeLog.second()}-${timeLog.date()}/${timeLog.month()} `+`${message}`;

    //save log to document logs
    let newLog = await mongoose.model('logBacklinks').create({
        message: log,
        project: projectId
    })

    //push log to document projects
    let updateProject = await mongoose.model('projectBacklinks').findById(projectId);

    await updateProject.log.push(newLog._id);
    await updateProject.save();
}

const saveLogAD = async (projectId, message) => {

    let timeLog=moment().utcOffset('+7');

    let log=`${timeLog.hour()}:${timeLog.minute()}:${timeLog.second()}-${timeLog.date()}/${timeLog.month()} `+`${message}`;

    //save log to document logs
    let newLog = await mongoose.model('logAds').create({
        message: log,
        project: projectId
    })

    //push log to document projects
    let updateProject = await mongoose.model('projectAds').findById(projectId);

    await updateProject.log.push(newLog._id);
    await updateProject.save();
}

module.exports = {saveLog,saveLogBacklink,saveLogAD};