/*
 * Test cloud function
 */
// Parse.Cloud.beforeFind('Customer', async req => {
//   console.log('finding customers...')
// })



/*
 * Add jobNumber (auto increment) to new jobs
 */
Parse.Cloud.beforeSave('Job', async req => {
  if (!req.object.get('jobNumber')) {
    const Job = Parse.Object.extend('Job')
    const query = new Parse.Query(Job)
    query.addDescending('jobNumber')
    const newest = await query.first({ 
      useMasterKey: true
    })
    if (newest && newest.get('jobNumber') > 0) {
      req.object.set('jobNumber', newest.get('jobNumber') + 1)
    } else {
      req.object.set('jobNumber', 1)
    }
  }
})

/*
 * Fetch jobs by status if requested
 */
Parse.Cloud.beforeFind('Job', async req => {
  if (req.query._where.status) {
    const { status } = req.query._where
    let originalQuery = req.query
    let statusQuery = new Parse.Query('Job')
    let finished = new Parse.Query('Job').greaterThan('quantityDelivered', 0)
    let unfinished = Parse.Query.or(
      new Parse.Query('Job').doesNotExist('quantityDelivered'),
      new Parse.Query('Job').equalTo('quantityDelivered', 0),
      new Parse.Query('Job').equalTo('quantityDelivered', '')
    )
    let uninvoiced = Parse.Query.and(
      finished,
      Parse.Query.or(
        new Parse.Query('Job').doesNotExist('invoiceNumber'),
        new Parse.Query('Job').equalTo('invoiceNumber', 0),
        new Parse.Query('Job').equalTo('invoiceNumber', '')
      )
    )
    switch (status) {
      case 'unfinished':
        statusQuery = unfinished
        break;
      case 'finished':
        // statusQuery.greaterThanOrEqualTo('quantityDelivered', 1)
        statusQuery = finished
        break;
      case 'uninvoiced':
        statusQuery = uninvoiced
        break;
      default:
        console.log(`Unknown status "${status}" provided to job query`)
    }
    delete originalQuery._where.status
    return Parse.Query.and(statusQuery, originalQuery)
  }
})

Parse.Cloud.define('printJobSheet', async (req, response) => {
  const { jobNumber } = req.params
  const pdf = require('html-pdf')
  let htmlString = '<h1>Hello, Matt.</h1>'
  pdf.create(htmlString).toFile(`Job${jobNumber}.pdf`, (err, res) => {
    console.log(res.filename)
    console.log(response)
  })
})