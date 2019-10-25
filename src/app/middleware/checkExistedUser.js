const userDao=require('./../dao/userDao')
module.exports = async function checkExistedUser(req,res,next){
    let {username}=req.body
    let isExistedUsername=await userDao.checkExisted(username)
    
    if(isExistedUsername){
        res.json({
            status:409,
            message:'username existed'
        })
    }
    next()
}