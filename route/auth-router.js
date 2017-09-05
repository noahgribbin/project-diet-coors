'use strict';

const debug = require('debug')('dungeonManager:auth-router');
const createError = require('http-errors');
const Router = require('express').Router;
const jsonParser = require('body-parser').json();

const User = require('../model/user.js');
const basicAuth = require('../lib/basic-auth-middleware.js');

const authRouter = module.exports = Router();

authRouter.post('/api/signup', jsonParser, function(req, res, next) {
  debug('POST /api/signup');

  if (!req._body) return next(createError(400, 'request body expected'));

  let response = {};
  let password = req.body.password;
  delete req.body.password;
  let user = new User(req.body);
  user.generatePasswordHash(password)
  .then( user => user.save())
  .then( user => {
    console.log('here');
    response.user = user;
    return user.generateToken()
   })
  .then( token => {
    response.token = token;
    res.send(response)
  })

  .catch(next);
});

authRouter.get('/api/signin', basicAuth, function(req, res, next) {
  debug('GET /api/signin');


  let response = {};
  User.findOne({ username: req.auth.username})
  .then( user => {
    return user.comparePasswordHash(req.auth.password);
  })
  .then( user => {
    response.user = user;
    return user.generateToken();
  })
  .then( token => {
    response.token = token;
    res.send(response);

  })
  .catch(next);
});

authRouter.put('/api/account', basicAuth, jsonParser, function(req, res, next) {
  debug('PUT /api/account');

  if(!req._body) return next(createError(400, 'expected request body'));
  User.findOne({ username : req.auth.username })
  .then( user => user.comparePasswordHash(req.auth.password))
  .then( user => {
    if(req.body.password) {
      user.generatePasswordHash(req.body.password)
      .then( user => req.body.password = user._id)
      .catch(next);
    }
    User.findByIdAndUpdate(user._id, req.body, {new: true})
    .then( user => res.json(user))
    .catch(next);
  })
  .catch(next);
});
