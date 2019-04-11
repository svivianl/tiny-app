// git push -u origin master
/***************************************************************************
  Variables
***************************************************************************/
const bodyParser      = require("body-parser");
const express         = require("express");
const cookieParser    = require('cookie-parser');
const bcrypt          = require('bcrypt');
const cookieSession   = require('cookie-session');

var app     = express();
var PORT    = 8080;

/***************************************************************************
  Data
***************************************************************************/
// urlDatabase keys:
//    longURL
//    userID
let urlDatabase = {};

// users keys:
//    id
//    email
//    password
let users = {};

/***************************************************************************
  Initialization
***************************************************************************/
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

/***************************************************************************
  Functions
***************************************************************************/
const generateRandomString = () => Math.random().toString(36).substring(7);

// gets user by e-mail
const getUser = email => {
  let found = undefined;
  consoleDB('users  ', users);
  if(Object.keys(users).length === 0){ return found; }

  for(user in users){
    if(users[user].email === email){
      found = users[user];
      break;
    }
  }
  return found;
}

// checks if e-mail already exists
const userExists = email => {
  let found = false;
  for(user in users){
    if(users[user].email === email){
      found = true;
      break;
    }
  }
  return found;
}

// gets the user's URLs
const urlsForUser = userID => {

  let found = {};

  for(key in urlDatabase){
    if(urlDatabase[key].userID === userID){
      found[key] = urlDatabase[key].longURL ;
    }
  }

  // if the object found is empty, pass the value -1
  if(Object.keys(found).length === 0){ found = -1;}

  return found;
}

const isUserLoggedIn = (id) => (id === undefined) ?  false : true;

const consoleDB = (name, req)=>{
  console.log(name);
  console.log('urlDatabase ',urlDatabase);
  if(req.session && req.session.hasOwnProperty('user_id')){
    console.log('user_id ',req.session.user_id);
  }else{
    console.log('user_id ');
  }
  console.log('users ',users);
}

const updatedB = (req) => {
  console.log('session: ', req.session);
    // update DB with cookie or create cookie
  if(req.session.hasOwnProperty('users')){
    users = {...req.session.users};
  }else{
    req.session.users = {};
  }

  if(req.session.hasOwnProperty('urlDatabase')){
    urlDatabase = {...req.session.urlDatabase};
  }else{
    req.session.urlDatabase = {};
  }

  if(! req.session.hasOwnProperty('user_id')){
    req.session.user_id = '';
  }
}

/***************************************************************************
  Middlewares
***************************************************************************/

// checks if the user is logged in
const isLoggedIn = (req, res, next)=>{

  // let templateVars = {
  //   user: users[req.session.user_id],
  //   error: ''
  // };

  if(!isUserLoggedIn(req.session.user_id)){
    // templateVars.error = 'Please login';
    return res.redirect('/login');
  }

  return next();

};

// checks if URLs exist for the user logged in
const urlsExist = (req, res, next)=>{

  // let templateVars = {
  //   user: users[req.session.user_id],
  //   error: ''
  // };

  if(!isUserLoggedIn(req.session.user_id)){
    return res.redirect('/login');
  }

  // check if the user has URLs
  if(urlsForUser(req.session.user_id) === -1){
    // templateVars.urls = {};
    // templateVars.error = 'Please create URLs';
    return res.redirect('/urls/new');
  }

  return next();
};

// checks if the user that is calling the method is the same that created
// the URL
const isUserID = (req, res, next)=>{

  // let templateVars = {
  //   user: users[req.session.user_id],
  //   error: ''
  // };

  if(!isUserLoggedIn(req.session.user_id)){
    // console.log('here');
    // window.alert('Please Login or Register');
    // req.flash =('error', 'Please Login or Register');
    return res.redirect('/login');
  }

  // check if the user that is logged in is the same as the userID that created the URL

  if(urlDatabase[req.params.id].userID !== req.session.user_id){
    // templateVars.urls = {};
    // templateVars.error = 'Please create URLs';
    return res.status(403).send(`Unauthorized`);
  }

  return next();
};

app.use((req, res, next)=>{

  updatedB(req);

  next();
});

/***************************************************************************
  Routes
***************************************************************************/
// sends the URLs json
app.get("/urls.json", (req, res) => {
  // updatedB(req);

  res.json(urlDatabase);
});

// goes to the Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// new URL page
app.get("/urls/new", isLoggedIn, (req, res) => {
  // updatedB(req);

  res.render("urls_new", {user: users[req.session.user_id]});
});

// deletes URL
app.post('/urls/:id/delete', isUserID, (req, res) =>{
  // updatedB(req);

  if(res.statusCode === 200){
    // console.log(urlDatabase);
    delete urlDatabase[req.params.id];
    // update cookie
    req.session.urlDatabase = urlDatabase;
  }
  res.redirect('/urls');
});

// updates the URL
app.post("/urls/:id", isUserID, (req, res) => {
  // updatedB(req);

  if(res.statusCode === 200){

    urlDatabase[req.params.id] = {};
    urlDatabase[req.params.id].longURL = req.body.longURL;
    urlDatabase[req.params.id].userID = req.session.user_id;

    // update cookie
    req.session.urlDatabase = urlDatabase;
  }
  // console.log('Update urlDatabase ', urlDatabase);
  res.redirect('/urls');
});

// displays the URL
app.get("/urls/:id", (req, res) => {
  // updatedB(req);

  let templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id]
  };

  res.render("urls_show", templateVars);
});

// posts new URL
app.post("/urls", isLoggedIn, (req, res) => {
  if(res.statusCode === 200){
    // updatedB(req);

    let newKey = generateRandomString();
    urlDatabase[newKey] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };

    // update cookie
    req.session.urlDatabase = urlDatabase;
    res.redirect(`/urls/${newKey}`);
  }else{
    res.redirect(`/urls/new`);
  }

});

// displays the URLs
app.get("/urls", (req, res) => {
// app.get("/urls", urlsExist, (req, res) => {
  // updatedB(req);

  // consoleDB('urls', req);

  let urls = {};
  let templateVars = {
    urls: {},
    user: users[req.session.user_id],
    error: ''
  };

  // get the URLs only if the user is logged in
  if(req.session.user_id){
    // for(key in urlDatabase){
    //   templateVars.urls[key] = urlDatabase[key].longURL ;
    // }
    templateVars.urls = {...urlsForUser(req.session.user_id)};
    // templateVars.error = 'Please login or create URLs';
  }

  res.render("urls_index", templateVars );
});

// goes redirect to the URL
app.get("/u/:id", (req, res) => {
  // updatedB(req);
  // if(req.params.id === undefined){
  //   res.redirect('/urls');
  // }else{
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
  // }

});

//login
app.get("/login", (req, res) => {
  // updatedB(req);
  res.render("user_login", {user: users[req.session.user_id]});
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // check if the input data are empty
  if(email === '' || password === ''){
    return res.status(400).send('email and password cannot be empty');
  }

  if(res.statusCode === 200){
    // updatedB(req);

    // get user by e-mail
    let user = getUser(email);

    // check if email is unique
    if(! user){
      return res.status(403).send('User not found');
    }

    if(bcrypt.compareSync( password, user.password)){
      // update cookie
      req.session.user_id = user.id;
      res.redirect("/urls");
    }else{
      res.status(403).send(`Password doesn't match`);
    }
  }
});

//logout
app.post("/logout", (req, res) => {
  // updatedB(req);

  // clear cookie's user_id
  req.session.user_id = '';
  // urlDatabase = {};
  res.redirect("/urls");
});

// signup
app.get("/register", (req, res) => {
  res.render("user_new", {user: ''});
});
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  consoleDB('register', req);
  // check if the input data are empty
  if(email === '' || password === '' || email.replace(/\s/g, '') === '' || password.replace(/\s/g, '') === ''){
    return res.status(400).send('email and password cannot be empty');
  }

  if(res.statusCode === 200){
    // updatedB(req);

    consoleDB('register, if ', req);
    // check if email is unique
    if(getUser(email)){
      // res.redirect(`/register`);
      return res.status(400).send('email already exists');
    }

    // const { id } = req.body.username;
    const id = generateRandomString();

    users[id] = {
      id,
      email,
      password: bcrypt.hashSync(password, 20)
    };

    // update cookies
    req.session.user_id = id;
    req.session.users = users;
    res.redirect(`/urls`);
  }
});

// root path
app.get("/", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

/***************************************************************************
  Listeners
***************************************************************************/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});