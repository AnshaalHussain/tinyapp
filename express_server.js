const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var cookieParser = require('cookie-parser');
app.use(cookieParser());
//app.use(express.json())

const random = function(){
  var id = "id" + Math.random().toString(16).slice(2);
  return id;
}


// objects serving as databases --->

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const usersDb = {};

// HELPER FUNCTION: check if user already exists in usersDB
const findUserByEmail = function(email, users) {
  for(let userId in users) {
    const user = users[userId];
    if(email === user.email) {
      return user;
    }
  }
  return false;
}

// HELPER FUNCTION: authenticates users - takes in usersDb as parameter
const authenticateUser = function(email, password, usersDb) {
  // retrieve the user from the db (using helper function)
  const userFound = findUserByEmail(email, usersDb);
  if (userFound && userFound.password === password){
    return userFound;
  }

  return false;
};

// App endpoints --->
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  res.redirect("/urls")
});

app.get("/urls", (req, res) => {
  // retrieve the user info -> cookies to retrieve the user id
  const userId = req.cookies['user_id'];

  // retrieving the user object from userDb
  const loggedInUser = usersDb[userId];

  const templateVars = {
    user: loggedInUser,
    urls: urlDatabase,
  };
  res.render('url_index', templateVars);

});
app.get('/login', (req, res) => {

  const templateVars = {user: null};
  res.render('url_login', templateVars)

});

app.post('/login', (req, res) => {

  //extract email and pass from body of request => req.body
  const email = req.body.email;
  const password = req.body.password;

  // retrieve the user from the db (using helper function)
  const userFound = findUserByEmail(email, usersDb);
  // compare the passwords
  // password match => login
  // password don't match => error message

  const user = authenticateUser(email, password, usersDb);

  if (user){ // if this happens (true), then user is authenticated

    // setting the cookie
    res.cookie('user_id', userFound.id);

    // redirect to /urls
    res.redirect('/urls') // hey browser, can you do another request => get /urls
    return;
  }

  // else (false) the user is not authenticated => send error
  
  res.status(401).send('Wrong credentials');
  
  // retrieve the user info -> cookies to retrieve the user id
  const userId = req.cookies['user_id'];

  // retrieving the user object from userDb
  const loggedInUser = usersDb[userId];

  res.redirect('/urls')

});


app.get('/logout', (req, res) => {

  const templateVars = {user: null};
  res.render('url_login', templateVars)

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect("/urls")
});


app.get("/urls/:shortURL", (req, res) => {

  const userId = req.cookies['user_id'];

  const loggedInUser = usersDb[userId];
  const templateVars = {    
  shortURL: req.params.shortURL, 
  longURL:req.params.longURL, 
  user: loggedInUser,
};
  res.render("url_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // const templateVars = { shortURL: req.params.shortURL, longURL:req.params.longURL };
  const urlToDelete = req.params.shortURL;
  console.log(urlToDelete)
  delete urlDatabase[urlToDelete];
  res.redirect("/urls");
});

// GET: asking as client to display a page
app.get("/register", (req, res) => {
 
  const templateVars = {user: null}
  res.render("url_register", templateVars)
});



// POST: client modifies something and post collects that data
app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  // userFound can be user object or false:
  const userFound = findUserByEmail(email, usersDb);

  if(userFound) {
    return res.status(401).send("Sorry, that user already exists!");
  };

  // userFound is false so:
  // generate new ID:
  const userId = random();

  // create new user:
    usersDb[userId] = {
      id: userId,
      email: email,
      password: password,
    }

  // log the user --> ask browser to set a cookier with user id
  res.cookie("user_id", userId);

  // redirect to /urls
  res.redirect("/urls");


});
