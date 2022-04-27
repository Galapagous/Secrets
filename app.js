//jshint esversion:6
require("dotenv").config()
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))

app.use(
  session({
    secret: "Kpandaragi is my hometown",
    resave: false,
    saveUninitialized: true,
  })
)

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb+srv://" + process.env.MONGO_USERNAME + ":" + process.env.MONGO_PASSWORD + "@cluster0.6k0zf.mongodb.net/testDB?retryWrites=true&w=majority")

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String,
})

userSchema.plugin(passportLocalMongoose)

// console.log(process.env.API_KEY)

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] })

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/", (req, res) => {
  res.render("home")
})
app.get("/login", (req, res) => {
  res.render("login")
})
app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/logout", (req, res) => {
  req.logout()
  res.redirect("/")
})

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit")
  } else {
    res.redirect("/login")
  }
})

app.post("/submit", function (req, res) {
  const submittedSecrets = req.body.secret
  // console.log(req.user)
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err)
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecrets
        foundUser.save(function () {
          res.redirect("/secrets")
        })
      }
    }
  })
})

app.get("/secrets", function (req, res) {
  User.find({ secret: { $ne: null } }, function (err, foundUsers) {
    if (err) {
      console.log(err)
    } else {
      if (foundUsers) {
        res.render("secrets", { UsersWithSecret: foundUsers })
      }
    }
  })
})

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err)
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets")
      })
    }
  })
})
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  })
  req.login(user, function (err) {
    if (err) {
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets")
      })
    }
  })
})

let port = process.env.PORT
if (port === null || port === "") {
  port = 3000
}

app.listen(port, function () {
  console.log("App is listening on port 3000")
})
