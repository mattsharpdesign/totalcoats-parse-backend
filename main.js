const express = require('express')
const ParseServer = require('parse-server').ParseServer
const ParseDashboard = require('parse-dashboard')
const app = express()

const dotenv = require('dotenv')
dotenv.config()

const api = new ParseServer({
  databaseURI: 'mongodb://localhost:27017/test', // Connection string for your MongoDB database
  cloud: __dirname + '/functions/main.js', // Absolute path to your Cloud Code
  appId: process.env.PARSE_APP_ID,
  masterKey: process.env.PARSE_MASTER_KEY, // Keep this key secret!
  serverURL: 'http://localhost:1337/api', // Don't forget to change to https if needed
  restApiKey: process.env.PARSE_REST_API_KEY,
});

const dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": "http://localhost:1337/api",
      "appId": process.env.PARSE_APP_ID,
      "masterKey": process.env.PARSE_MASTER_KEY,
      "appName": "TotalCoats"
    }
  ]
})

app.use('/api', api)

app.use('/dashboard', dashboard)

app.get('/', (req, res) => {
  res.json('Hello, developer.')
})

app.listen(1337, function() {
  console.log('Server listening on port 1337')
})
