const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const Diag = require('./model/chat')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { assert } = require('console')
const JWT_SECRET = 'sjflkfhnswklhilwhalefnakfnkjghkjugh476@$#%^&*&&*'

mongoose.connect('mongodb://localhost:27017/chatbot_app_db', {
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true
})

const app = express()
//app.use('/', express.static(path.join(__dirname, 'static')))
app.use(express.static('static'))
app.use(bodyParser.json())

app.post('/api/chatbot', (req, res) => {
    console.log("neha")
    const ques = req.body.ques
    //const outputFromDb = Diag.dialogues1.find({"ques" : ques}, {"_id" : 0, "response1" : 1})
    const outputFromDb = await Diag.dialogues1.find({"ques" : ques})
    const ourResp = outputFromDb.response1
    console.log(ourResp)
    if(! outputFromDb) {
        return res.json({status : 'error', error : 'Idk'})
    } else {
        return res.json({status : 'ok', data : ourResp})
    }
})

app.post('/api/login', async (req, res) => {
    const {username, password} = req.body
    const user = await User.findOne({username}).lean()
    if(!user) {
        return res.json({status : 'error', error : 'Invalid username / password'})
    }
    if(await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({id : user._id, username : user.username}, JWT_SECRET) //public and visible.
        return res.json({status : 'ok',  data : token})
    }

    res.json({status : 'error', error : 'Invalid username / password'})
})

app.post('/api/register', async (req, res) => {
    const {username, password : plainTextPassword} = req.body
    if(!username || typeof username !== 'string') {
        return res.json({status : 'error', error : 'Invalid username'})
    }
    if(!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json({status : 'error', error : 'Invalid password'})
    }
    if(plainTextPassword.length < 5) {
        return res.json({
            status : 'error', error : 'Password too small. Should be atleast 6 characters'
        })
    }
    
    const password = await bcrypt.hash(plainTextPassword, 10)
    try {
        const response = await User.create({
            username,
            password
        })
        console.log('User created Successfully : ', response)        

    } catch(error) {
        if (error.code === 11000) {
            return res.json({status : 'error', error : 'Username already in use'})
        }
        throw error
    }
    res.json({status : 'ok'})
})
app.listen(9999, () => {
    console.log('Server up at 9999')
}) 