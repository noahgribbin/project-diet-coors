'use strict';

const cors = require('cors');
const debug = require('debug')('dungeonManager:server');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const Promise = require('bluebird');


const bearerAuth = require('./lib/bearer-auth-middleware.js');
const jsonParser = require('body-parser').json();


const Profile = require('./model/profile.js');
const Dm = require('./model/dm.js');

const errors = require('./lib/error-middleware.js');

const authRouter = require('./route/auth-router.js');
const characterRouter = require('./route/character-router.js');
const dmRouter = require('./route/dm-router.js');
const profileRouter = require('./route/profile-router.js');

dotenv.load();

const app = express();

mongoose.Promise = Promise;
console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI);


var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(cors());
app.use(morgan('dev'));
app.use(authRouter);
app.use(profileRouter);
app.use(characterRouter);
app.use(dmRouter);
app.use(errors);

app.listen((process.env.PORT || 8000), () => debug('server up on port:', process.env.PORT));
