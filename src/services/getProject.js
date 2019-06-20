var mongoose = require('mongoose');

const getProject = async (id) => {

  try {

    let project = await mongoose.model('projects').findById(id);

    return project;

  } catch (error) {

    return null;
  }
}

module.exports = getProject;