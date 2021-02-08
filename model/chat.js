const mongoose = require('mongoose')

const UserSchema1 = new mongoose.Schema ({
    ques : { type : String, required : true, unique : true},
    response : { type : String, required : true }
},
{collection : 'dialogues1'}) 

const model1 = mongoose.model('UserSchema1', UserSchema1)
module.exports = model1
