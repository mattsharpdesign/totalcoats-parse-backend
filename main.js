const express = require('express')
const ParseServer = require('parse-server').ParseServer
const ParseDashboard = require('parse-dashboard')
const app = express()
const cors = require('cors')

const dotenv = require('dotenv')
dotenv.config()

const pdf = require('html-pdf')

const SERVER_URL = "http://localhost:1337/api"
const APP_NAME = "TotalCoats"

const api = new ParseServer({
  databaseURI: 'mongodb://localhost:27017/test',
  cloud: __dirname + '/functions/main.js', // Absolute path to your Cloud Code
  appId: process.env.PARSE_APP_ID,
  masterKey: process.env.PARSE_MASTER_KEY, // Keep this key secret!
  serverURL: SERVER_URL, // Don't forget to change to https if needed
  restApiKey: process.env.PARSE_REST_API_KEY,
  allowClientClassCreation: false,
  // javascriptKey: process.env.PARSE_JAVASCRIPT_KEY,
});

const dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": SERVER_URL,
      "appId": process.env.PARSE_APP_ID,
      "masterKey": process.env.PARSE_MASTER_KEY,
      "appName": APP_NAME,
      "javascriptKey": process.env.PARSE_JAVASCRIPT_KEY,
    }
  ]
})

app.use(cors())

app.get('/pdf/job-sheet/:jobNumber', (req, res) => {
  const { jobNumber } = req.params
  const html = `<h1>Job ${jobNumber}</h1>`
  const options = {
    format: 'A5',
    orientation: 'landscape',
  }
  pdf.create(html, options).toBuffer((err, buffer) => {
    res.type('pdf')
    res.set('Content-Disposition', `attachment; filename="JOB${jobNumber}.pdf"`)
    res.send(buffer)
  })
  // res.json('test')
})

app.use('/api', api)

app.use('/dashboard', dashboard)

app.use('/public', express.static(__dirname + '../totalcoats-mithril-frontend/public', ))

app.listen(1337, function() {
  console.log('Server listening on port 1337')
})

app.use((err, req, res, next) => {
  console.error(err.message)
})
