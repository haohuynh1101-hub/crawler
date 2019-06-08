var mongoose = require('mongoose');

/**
 * save log   suggest 
 * @param {*} projectId 
 * @param {*} message 
 */
const saveLog = async (projectId, message) => {

    let timeLog = new Date();

    let log = `${timeLog.getHours() > 10 ? timeLog.getHours() : '0' + timeLog.getHours()}:`
        + `${timeLog.getMinutes() > 10 ? timeLog.getMinutes() : '0' + timeLog.getMinutes()}:`
        + `${timeLog.getSeconds() > 10 ? timeLog.getSeconds() : '0' + timeLog.getSeconds()}:`
        + `  ${message}`;

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

    let timeLog = new Date();

    let log = `${timeLog.getHours() > 10 ? timeLog.getHours() : '0' + timeLog.getHours()}:`
        + `${timeLog.getMinutes() > 10 ? timeLog.getMinutes() : '0' + timeLog.getMinutes()}:`
        + `${timeLog.getSeconds() > 10 ? timeLog.getSeconds() : '0' + timeLog.getSeconds()}:`
        + `  ${message}`;

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

module.exports = {saveLog,saveLogBacklink};