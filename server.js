'use strict';

const cors = require('cors');
const debug = require('debug')('dungeonManager:server');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const Promise = require('bluebird');

const errors = require('./lib/error-middleware.js');

const authRouter = require('./route/auth-router.js');
// const characterRouter = require('./route/character-router.js');
const dmRouter = require('./route/dm-router.js');
const profileRouter = require('./route/profile-router.js');

dotenv.load();

const app = express();

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI);

app.use(cors());
app.use(morgan('dev'));
app.use(authRouter);
app.use(profileRouter);
// app.use(characterRouter);
app.use(dmRouter);
app.use(errors);

app.listen((process.env.PORT || 8000), () => debug('server up on port:', process.env.PORT));
