# TotalCoats Backend

## Converting data from within MS Access

Export these tables:
- CUSTOMER
- POWDER TABLE
- JOB ENTRY
- Supplier2
- PRODUCT
- JIG TYPE

All other tables can be ignored.

1. Export table as type `Text Files`

## Converting data using mdb-tools

`apt install mdbtools`

`mdb-export -H -D "%F" TOTALCONEW.mdb "POWDER TABLE" > exported/Powder.csv`

`/opt/mongo/bin/mongoimport -d test -c Powder --drop --type=csv --fieldFile=Powder.fields.txt --columnsHaveTypes --parseGrace=autoCast exported/Powder.csv`

```
db.Powder.find().forEach(function(p) {
  db.Powder.updateOne(
    { _id: p._id }, 
    {
      $set: { 
        dateEntered: new Date(p.dateEntered) 
      }
    }
  )
})
```
