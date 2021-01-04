require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
mongoose.set('useFindAndModify', false);

const app = express();

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser:true, 
  useUnifiedTopology: true}) //for production

// //mongoose.connect("mongodb+srv://user1:@freecodecamp.4rcza.mongodb.net/db1?retryWrites=true&w=majority", 
// {useNewUrlParser:true, 
//   useUnifiedTopology: true}) //for locally

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let uri = process.env.MONGODB_URI

let urlSchema = new mongoose.Schema({
  original : {type: String, required: true},
  short: Number
})

let Url = mongoose.model('Url',urlSchema)


let bodyParser = require('body-parser')
let responseObject={}
app.post('/api/shorturl/new',bodyParser.urlencoded({extended:false}), (request, response)=>{
  let inputUrl = request.body.url

  let urlRegex = new RegExp(/^[http://www.]/gi )

  if(!inputUrl.match(urlRegex)){
    response.json({ error: 'invalid url' })
    return
  }

  responseObject['original_url'] = inputUrl

  let inputShort = 1

  Url.findOne({}) //will look through everything with no entry
      .sort({short:'desc'}) //get back highest short number
      .exec((error, result)=>{
        if(!error && result !=undefined){ //first time running, will be no result entry
          inputShort = result.short+1
        }
        if(!error){
          Url.findOneAndUpdate(
            {original:inputUrl}, //if theres one to replace
            {original:inputUrl, short:inputShort}, //set for new or update
            {new: true, upsert:true},
            (error, savedUrl)=>{
              if(!error){
                responseObject['short_url'] = savedUrl.short
                response.json(responseObject)
              }
            }
          )
        }
      })
})

app.get('/api/shorturl/:input',(request,response)=>{
  let input = request.params.input

  Url.findOne({short: input}, (error,result)=>{
    if(!error && result != undefined){
      response.redirect(result.original)
    }else{
      response.json('URL Not Found')
    }
  })
})

