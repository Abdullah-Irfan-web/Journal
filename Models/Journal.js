const mongoose=require('mongoose');

let journalschema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    journalname:{
        type:String,
        required:true
    },
    journaldescription:{
        type:String,
        required:true
    },
    studenttag:{
        type:String,
        required:true
    },
    file:{
        type:String,
        required:true
    },
    year:{
        type:String,
        required:true
    },
    month:{
        type:String,
        required:true
    },
    day:{
        type:String,
        required:true
    }
})
module.exports=mongoose.model('Journal',journalschema);