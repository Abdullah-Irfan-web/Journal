const mongoose=require('mongoose');

let userschema=new mongoose.Schema({
    from:{
        type:String,
        required:true
    },
    to:{
        type:String,
        required:true
    },
   
})

module.exports=mongoose.model('Notification',userschema)