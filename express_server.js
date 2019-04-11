// git push -u origin master
/***************************************************************************
  Variables
***************************************************************************/
const bodyParser      = require("body-parser");
const express         = require("express");
const cookieParser    = require('cookie-parser');
const bcrypt          = require('bcrypt');
const cookieSession   = require('cookie-session');

const app     = express();
const PORT    = 8080;

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
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

/***************************************************************************
  Functions
***************************************************************************/
const generateRandomString = () => Math.random().toString(36).substring(7);

// gets user by e-mail
const getUser = email => {

  let found = undefined;

  for(user in users){
    if(users[user].email === email){
      found = users[user];
      break;
    }
  }

  return found;

}

// check if e-mail already exists
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

// checks if user is logged in
const isUserLoggedIn = (id) => (id === '' || id === undefined) ?  false : true;

// update DB with cookie or create cookie
const updatedB = (req) => {

  if(! req.session.hasOwnProperty('user_id')){
    req.session.user_id = '';
  }

}

/***************************************************************************
  Middlewares
***************************************************************************/

// checks if the user is logged in
const isLoggedIn = (req, res, next)=>{

  if(!isUserLoggedIn(req.session.user_id)){
    return res.redirect('/login');
  }

  return next();
};

// checks if URLs exist for the user logged in
const urlsExist = (req, res, next)=>{

  if(!isUserLoggedIn(req.session.user_id)){
    return res.redirect('/login');
  }

  // check if the user has URLs
  if(urlsForUser(req.session.user_id) === -1){
    return res.redirect('/urls/new');
  }

  return next();
};

// checks if the user that is calling the method is the same that created
// the URL
const isUserID = (req, res, next)=>{

  if(!isUserLoggedIn(req.session.user_id)){
    return res.redirect('/login');
  }

  if(urlDatabase[req.params.id].userID !== req.session.user_id){
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
  res.json(urlDatabase);
});

// goes to the Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// new URL page
app.get("/urls/new", isLoggedIn, (req, res) => {
  res.render("urls_new", {user: users[req.session.user_id]});
});

// deletes URL
app.post('/urls/:id/delete', isUserID, (req, res) =>{

  if(res.statusCode === 200){
    delete urlDatabase[req.params.id];
    // req.session.urlDatabase = urlDatabase;
  }
  res.redirect('/urls');

});

// updates the URL
app.post("/urls/:id", isUserID, (req, res) => {

  if(res.statusCode === 200){
    urlDatabase[req.params.id] = {};
    urlDatabase[req.params.id].longURL = req.body.longURL;
    urlDatabase[req.params.id].userID = req.session.user_id;
    // req.session.urlDatabase = urlDatabase;
  }

  res.redirect('/urls');
});

// displays the URL
app.get("/urls/:id", (req, res) => {

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

    let newKey = generateRandomString();

    urlDatabase[newKey] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };

    // req.session.urlDatabase = urlDatabase;
    res.redirect(`/urls/${newKey}`);

  }else{
    res.redirect(`/urls/new`);
  }

});

// displays the URLs
app.get("/urls", (req, res) => {

  let urls = {};
  let templateVars = {
    urls: {},
    user: users[req.session.user_id],
    error: ''
  };

  if(req.session.user_id){
    templateVars.urls = {...urlsForUser(req.session.user_id)};
  }

  res.render("urls_index", templateVars );
});

// goes redirect to the URL
app.get("/u/:id", (req, res) => {

  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);

});

//login
app.get("/login", (req, res) => {
  res.render("user_login", {user: users[req.session.user_id]});
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // check if the input data are empty
  if(email === '' || password === ''){
    return res.status(400).send('email and password cannot be empty');
  }

  if(res.statusCode === 200){

    let user = getUser(email);

    // check if email is unique
    if(! user){
      return res.status(403).send('User not found');
    }

    if(bcrypt.compareSync( password, user.password)){
      req.session.user_id = user.id;
      res.redirect("/urls");
    }else{
      res.status(403).send(`Password doesn't match`);
    }
  }
});

//logout
app.post("/logout", (req, res) => {
  req.session.user_id = '';
  res.redirect("/urls");
});

// signup
app.get("/register", (req, res) => {
  res.render("user_new", {user: ''});
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // check if the input data are empty
  if(email === '' || password === ''  || email.replace(/\s/g, '') === '' || password.replace(/\s/g, '') === ''){
    return res.status(400).send('email and password cannot be empty');
  }

  if(res.statusCode === 200){

    // check if email is unique
    if(getUser(email)){
      return res.status(400).send('email already exists');
    }

    const id = generateRandomString();

    users[id] = {
      id,
      email,
      password: bcrypt.hashSync(password, 10)
    };

    req.session.user_id = id;
    // req.session.users = users;
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