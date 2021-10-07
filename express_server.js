const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['tehsecretkey'],
}))
//const findUserByEmail = require('./helpers')

// objects serving as databases --->

const urlDatabase = {};

const usersDb = {};

//helper functions
function generateRandomString() {
  var id = "id" + Math.random().toString(16).slice(2);
  return id;
};

function urlsForUser(id) {
  const uniqueURLS = {};
  for (obj in urlDatabase){
    if (urlDatabase[obj]["userId"] === id) {
      uniqueURLS[obj] = urlDatabase[obj];
    }
  }
  return uniqueURLS;
};




//HELPER FUNCTION: check if user already exists in usersDB
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
  
  if (userFound && bcrypt.compareSync(password, userFound.password)){
    return userFound;
  }

  return false;
};


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// App endpoints --->
app.get("/", (req, res) => {
  res.redirect("/urls")

});

app.get("/urls", (req, res) => {
  // retrieve the user info -> cookies to retrieve the user id
  //const userId = req.cookies['user_id'];
  const userId = req.session.user_id;
  // retrieving the user object from userDb
  const loggedInUser = usersDb[userId];
  const personalURLDatabase = urlsForUser(userId)
  const templateVars = {
    user: loggedInUser,
    urls: personalURLDatabase,
  };

  if (templateVars.user) {
    res.render('url_index', templateVars);
  } else {
    res.redirect("/login")
  }
  
});

app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  const loggedInUser = usersDb[userId];

  //const longURL = req.body.longURL;
  //const shortURL = generateRandomString();


  //console.log("HELLO", longURL, shortURL);  // Log the POST request body to the console

  //res.redirect(`/urls/${shortURL}`)

});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const loggedInUser = usersDb[userId];
  const templateVars = {
    user: loggedInUser,
    urls: urlDatabase,
  };

  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
 
});

app.post("/urls/new", (req, res) => {

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userId = req.session.user_id;


  urlDatabase[shortURL] = {}
  urlDatabase[shortURL]["longURL"] = longURL;
  urlDatabase[shortURL]["userId"] = userId;
  urlsForUser();
  res.redirect("/urls")

});

app.get('/login', (req, res) => {
  //const templateVars = {user: null};
  const userId = req.session.user_id;
  const loggedInUser = usersDb[userId];

  const templateVars = {
    user: loggedInUser,
  }

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
      //res.cookie('user_id', userFound.id);
      req.session.user_id = userFound.id;

      // redirect to /urls
      res.redirect('/urls') // hey browser, can you do another request => get /urls
      return;
    } 
      // else (false) the user is not authenticated => send error
    
    res.status(401).send('Wrong credentials');
    return;
});


app.get('/logout', (req, res) => {

  const templateVars = {user: null};
  res.render('url_login', templateVars)

});

app.post("/logout", (req, res) => {
  //res.clearCookie('user_id')
  req.session = null;
  res.redirect("/urls")
});



app.get("/urls/:shortURL", (req, res) => {

  //const userId = req.cookies['user_id'];

  const userId = req.session.user_id;
  const loggedInUser = usersDb[userId];
  const shortURL = req.params.shortURL;
  const templateVars = {    
  shortURL, 
  longURL: urlDatabase[shortURL]["longURL"],
  user: loggedInUser,
  urls: urlDatabase,
  };

  if (templateVars.user) {
    res.render("url_show", templateVars);
  } else {
    res.redirect("/login")
  }

});

app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body;
  const shortURL = req.params.shortURL;

  urlDatabase[shortURL]["longURL"] = longURL["longURL"];
  console.log("ID between users?", urlDatabase)
  res.redirect("/urls");
});




app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  //NOTE: longURL must include https:// before url. google.com won't work, but https://google.com does
  res.redirect(longURL)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // const templateVars = { shortURL: req.params.shortURL, longURL:req.params.longURL };
  const urlToDelete = req.params.shortURL;
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
  const hashedPassword = bcrypt.hashSync(password, 10);

  // userFound can be user object or false:
  const userFound = findUserByEmail(email, usersDb);

  if(userFound) {
    return res.status(401).send("Sorry, that user already exists!");
  };

  // userFound is false so:
  // generate new ID:
  const userId = generateRandomString();

  // create new user:
  usersDb[userId] = {
    id: userId,
    email: email,
    password: hashedPassword,
  }

  // log the user --> ask browser to set a cookier with user id
  //res.cookie("user_id", userId);
  req.session.user_id = userId;

  // redirect to /urls
  res.redirect("/urls");


});
