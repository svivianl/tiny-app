/***************************************************************************
  Variables
***************************************************************************/
const bodyParser  = require("body-parser");
var express       = require("express");


var app     = express();
var PORT    = 8080;

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/***************************************************************************
  Initialization
***************************************************************************/
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");


/***************************************************************************
  Functions
***************************************************************************/
function generateRandomString() {
  let data = '1234567890qwertyuiopsdfghjklçazxcvbnm';
  let code = '';

  data = data.split('');
  let dataLength = data.length;

  for(let i = 0; i < 6; i++){
    code += data[Math.floor(Math.random() * Math.floor(dataLength))];
  }

  return code;
}

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
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
// posts new URL
app.post("/urls", (req, res) => {
  if(res.statusCode === 200){
    let newKey = generateRandomString();
    urlDatabase[newKey] = req.body.longURL;

    res.redirect(`/urls/${newKey}`);
  }else{
    res.redirect(`/urls/new`);
  }

  // console.log(req.body);  // Log the POST request body to the console
  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

// displays the URL
app.get("/urls/:shortURL", (req, res) => {
  // console.log('req.params.shortURL ', req.params.shortURL);
  // console.log('urlDatabase[req.params.shortURL] ', urlDatabase[req.params.shortURL])
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// displays the URLs
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  // console.log('urls from express: ', templateVars);
  res.render("urls_index", templateVars);
});

// goes/redirect to the URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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