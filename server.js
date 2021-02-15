const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { assert } = require('console')
const { request } = require('http')
const { response } = require('express')
const JWT_SECRET = 'sjflkfhnswklhilwhalefnakfnkjghkjugh476@$#%^&*&&*'
const mongodb = require('mongodb')

mongoose.connect('mongodb://localhost:27017/chatbot_app_db', {
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true
})

const app = express()

const forChatbot = mongodb.MongoClient
app.use(express.static('static'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json());
app.use(express.json());


app.post('/api', (req, res) => {
    forChatbot.connect("mongodb://localhost:27017/", async function(err, db) {
        if (err) throw err
        const ques1 = req.body //request from frontend (message entered by user)
        console.log(ques1)
        console.log("Entering into the database");
        const dbo = db.db("chatbot_app_db")
        const result = await dbo.collection("dialogues").find(ques1).toArray() //searching for the user entered message in database.
        console.log("Result from database")
        console.log(result) //resultant record in an array. If the user entered message is not in the database, result will be an empty array. 

        if (result.length === 0 ) { //User entered message not found in database.
            return res.json({status : 'error', error : "Sorry, I don't understand"})
        } else { //User entered message found in database.
            console.log(result[0].response)
            const reply = result[0].response //reply message of the chatbot.
            res.json({ //response from backend to frontend.
                status : 'okay',
                ans : reply
            })
        }       
    })
})

app.post('/api/login', async (req, res) => {
    const {username, password} = req.body //Data from the request sent by the frontend (username and password entered by the user).
    const user = await User.findOne({username}).lean() //Searching if the username entered, exists in the database.
    if(!user) { // If doesn't exist
        return res.json({status : 'error', error : 'Invalid username / password'})
    }
    if(await bcrypt.compare(password, user.password)) { // If user - entered password matches with the encrypted password in the db, generate the token.
        const token = jwt.sign({id : user._id, username : user.username}, JWT_SECRET) //public and visible.
        return res.json({status : 'ok',  data : token}) // Log-in 
    }

    res.json({status : 'error', error : 'Invalid username / password'})
})

app.post('/api/register', async (req, res) => {
    const {username, password : plainTextPassword} = req.body // Data sent by the front end. (Username and password entered by the user)
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
    
    const password = await bcrypt.hash(plainTextPassword, 10) // encrypting the user entered password.
    try {
        const response = await User.create({ // Entering the username and encrypted password into the database.
            username,
            password
        })
        console.log('User created Successfully : ', response)        

    } catch(error) {     
        if (error.code === 11000) { // If user enters username that already exists. (Code 11000 indicates the duplicates)
            return res.json({status : 'error', error : 'Username already in use'})
        }
        throw error
    }
    res.json({status : 'ok'})
})
app.listen(9999, () => {
    console.log('Server up at 9999')
}) 
