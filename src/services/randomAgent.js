var mongoose = require('mongoose');

module.exports = {
    randomAgent: async () => {
        try {
            let lengthDoc = await mongoose.model('userAgents').countDocuments();
            let randomIndex = Math.floor(Math.random() * lengthDoc);
            let userAgent = await mongoose.model('userAgents').findOne({}, null, { skip: randomIndex });
            userAgent = userAgent.document;
            return userAgent;
        } catch (error) {
            
            console.log('random agent err: '+error);
        }
    }
}