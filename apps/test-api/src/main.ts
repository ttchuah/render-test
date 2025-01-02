/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import * as path from 'path';
import {router} from "./routes";

const app = express();

app.use(router);

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to test-api!' });
});

app.get("/data", (req, res) => {
  res.send([
    {
      id: 1,
      todo: "Wash the dishes"
    }, 
    {
      id: 2,
      todo: "Walk the dog"
    },
    {
      id: 3,
      todo: "Vacuum the floors"
    }
  ])
})

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
