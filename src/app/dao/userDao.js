const userModel=require('./../../model/schema').users

class UserDao {
    static async checkExisted(username) {
        let result = await userModel
        .find({
            username: username
        })
        .countDocuments()
        
        if (result > 0)
            return true
        return false
    }
}

module.exports=UserDao