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
    switch (status) {
      case 'unfinished':
        let dneQuery = new Parse.Query('Job').doesNotExist('quantityDelivered')
        let zeroQuery = new Parse.Query('Job').equalTo('quantityDelivered', 0)
        let emptyQuery = new Parse.Query('Job').equalTo('quantityDelivered', '')
        statusQuery = Parse.Query.or(dneQuery, zeroQuery, emptyQuery)
        break;
      case 'finished':
        statusQuery.greaterThanOrEqualTo('quantityDelivered', 1)
        break;
      default:
        console.log(`Unknown status "${status}" provided to job query`)
    }
    delete originalQuery._where.status
    return Parse.Query.and(statusQuery, originalQuery)
  }
})