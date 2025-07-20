const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const usersRouter = require('./routes/users');
const deviceUsersRouter = require('./routes/deviceUsers');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/users', usersRouter);
app.use('/device-users', deviceUsersRouter);

app.get('/', (req, res) => {
  res.send('Finger Sync Backend API');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 