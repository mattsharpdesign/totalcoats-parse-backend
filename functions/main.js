const pdf = require('html-pdf')

/*
 * Get user's roles
 */
Parse.Cloud.define('getUserRoles', async req => {
  const query = await new Parse.Query(Parse.Role).equalTo('users', req.user).find({ useMasterKey: true })
  return query
})


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
      case 'to be invoiced':
        statusQuery = uninvoiced
        break;
      case 'all':
        // do nothing
        break;
      default:
        console.log(`Unknown status "${status}" provided to job query`)
    }
    delete originalQuery._where.status
    return Parse.Query.and(statusQuery, originalQuery)
  }
})


/*
 * Generate job sheet PDF, save it to Parse Files, attach it to job
 * Send back url of newly saved PDF
 */
Parse.Cloud.define('createJobSheet', async req => {
  const { id } = req.params
  const Job = Parse.Object.extend('Job')
  const query = new Parse.Query(Job)
  const job = await query.get(id)
  const html = `
    <h1>Job ${job.get('jobNumber')}</h1>
    <h2>Customer: ${job.get('customer') ? job.get('customer').code : 'Unknown'}
    <h3>Order #: ${job.get('orderNumber')}</h3>
  `
  const options = {
    format: 'A5',
    orientation: 'landscape',
  }
  const buffer = await htmlToPdfAsBuffer(html, options)
  const base64String = buffer.toString('base64')
  const file = new Parse.File(`job_sheet_${job.get('jobNumber')}.pdf`, { base64: base64String }, 'application/pdf')
  await file.save()
  job.set('jobSheetPdf', file)
  await job.save()
  return file.url()
})

function htmlToPdfAsBuffer(html = '', options = {}) {
  return new Promise((resolve, reject) => {
    pdf.create(html, options).toBuffer((err, buffer) => {
      resolve(buffer)
    })
  })
}