var Const=require("Const");

//delay: time (second)
const setTimeDelay=(delay)=>{
    Const.timeDelay=delay*1000+4000;
}

module.exports= setTimeDelay;