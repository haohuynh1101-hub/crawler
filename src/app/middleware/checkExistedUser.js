const userDao=require('./../dao/userDao')
module.exports = async function checkExistedUser(req,res,next){
    let {username}=req.body
    console.log(username)
    let isExistedUsername=await userDao.checkExisted(username)
    console.log(isExistedUsername,'isExistedUsernameisExistedUsername')
}