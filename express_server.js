const bodyParser  = require("body-parser");
var express       = require("express");


var app     = express();
var PORT    = 8080;

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  // console.log('req.params.shortURL ', req.params.shortURL);
  // console.log('urlDatabase[req.params.shortURL] ', urlDatabase[req.params.shortURL])
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  // console.log('urls from express: ', templateVars);
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});