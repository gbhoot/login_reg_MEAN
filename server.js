var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session')({
    secret: "sssssssssssssssshhhh",
    autoSave: true,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 60000}
});

var app = express();

// Body Parser - Session
app.use(bodyParser.urlencoded({extended: true}));
app.use(session);

// Folders setup
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// Bcrypt
var bcrypt = require('bcrypt');
const saltRounds = 10;

// Mongoose
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
mongoose.connect('mongodb://localhost/basic_mongoose');
var UserSchema = mongoose.Schema({
    email: {type: String, required: [true, "Please enter your email"],
        unique: [true, "This email is already taken"]},
    first_name: {type: String, required: [true, "Please enter your first name"]},
    last_name: {type: String, required: [true, "Please enter your last name"]},
    password: {type: String, required: [true, "Please enter a password"]},
    birthday: {type: Date}
});
// UserSchema.plugin(uniqueValidator);
mongoose.model('User', UserSchema);
var User = mongoose.model('User');

// Routes
app.get('/', function(req, res) {
    if (req.session.uid) {
        res.redirect('/success');
    } else {
        res.render('index');
    }
});

app.post('/processRegister', function(req, res) {
    let new_user = req.body;
    bcrypt.hash(new_user.password, saltRounds)
    .then(hashed => {
        let user = new User({email: new_user.email, first_name: new_user.fname, 
            last_name: new_user.lname, password: hashed});
        user.save(function(error, thisUser) {
            if (error) {
                console.log("There was an issue: ", error);
            } else {
                req.session.uid = thisUser._id;
                console.log(thisUser);
                res.redirect('/success');
            }
        })
    }).catch(error => {
        console.log("There was an issue hashing: ", error);
    });
});

app.post('/processLogin', function(req, res) {
    let new_user = req.body;
    User.findOne({email: new_user.emailL}, function(error, user) {
        if (error) {
            console.log("There was an issue: ", error);
        }
        if (user == null) {
            console.log("Email does not exist, please register");
            res.redirect('/');
        } else {
            console.log(user);
            bcrypt.compare(new_user.passwordL, user.password)
            .then(result => {
                req.session.uid = user._id;
                res.redirect('/success');
            }).catch(error => {
                console.log("There was an issue: ", error);
            });
        }
    });
});

app.get('/processLogout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

app.get('/success', function(req, res) {
    if (!req.session.uid) {
        res.redirect('/')
    } else {
        res.render('success');
    }
});

app.listen(8000);