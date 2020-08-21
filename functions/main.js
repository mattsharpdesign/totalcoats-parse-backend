/*
** Test cloud function
*/
Parse.Cloud.beforeFind('Customer', async req => {
  console.log('finding customers...')
})



/*
** Add jobNumber (auto increment) to new jobs
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