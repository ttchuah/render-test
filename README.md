# RenderTest

## "Production" URLs.

API: https://test-api-4m6q.onrender.com/data
FE: https://render-test-5qvc.onrender.com/

## How to run the apps locally.

npx nx serve test-api
npx nx serve render-test

## Hosting information.

The API is hosted on render.com

The FE will be hosted on <TBD>

## Mongodb commands

To run these programs you must install the [command line tools](https://www.mongodb.com/docs/database-tools/installation/installation-macos/).

[More info on the command line tools](https://www.mongodb.com/docs/atlas/command-line-tools/#connect-with-mongodump).


Log into the DB: `mongo "mongodb+srv://donations.shzmc.mongodb.net/Donations" --username ttchuah`

Restore the DB from backups (in this example restoring just the Organizations collection): `mongorestore --uri mongodb+srv://ttchuah:<PASSWORD>@donations.shzmc.mongodb.net  -d donations -c organizations /users/thomaschuah/dump/organizations.bson`

Backup the DB: `mongodump --uri mongodb+srv://ttchuah:<PASSWORD>@donations.shzmc.mongodb.net/donations`

## Database access

Both dev and prod databases are hosted under free clusters in Atlas MongoDB.

The dev database is under ttchuah@gmail.com.
The prod data is under tchuah@ymail.com.

## Troubleshooting

### Unable to log in?

Log into MongoDB Atlas' web portal and ensure that your database clusters haven't been deactivated due to inactivity.

## Work log.

Jan 1, 2025
* Working on pdf.ts.  Trying to fix type errors here. Next step is to fix the TS errors in donationController.ts

## Notes.

* Tech debt: remove lodash