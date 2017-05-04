'use strict';

const debug = require('debug')('dungeonManager:profile-router');
const createError = require('http-errors');
const Router = require('express').Router;
const jsonParser = require('body-parser').json();

const bearerAuth = require('../lib/bearer-auth-middleware.js');
const Profile = require('../model/profile.js');
const User = require('../model/user.js');
// const Character = require('../lib/model/character.js');
// const Dm = require('../lib/model/dm.js');

const profileRouter = module.exports = Router();

profileRouter.post('/api/profile', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/profile');
  console.log(req.body);
  if (!req._body) return next(createError(400, 'request body expected'));
  req.body.userID = req.user._id;
  new Profile(req.body).save()
  .then( profile => res.json(profile))
  .catch(next);
});

profileRouter.get('/api/profile/:id', function(req, res, next) {
  debug('GET: /api/profile');

  Profile.findOne({ userID: req.params.id })
  .then( profile => res.json(profile))
  .catch(next);
});

profileRouter.put('/api/profile/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/profile/:id');

  if(req._body !== true) return next(createError(400, 'nothing to update'));

  Profile.findByIdAndUpdate(req.params.id, req.body, { new:true } )
  .then( profile => res.json(profile))
  .catch(next);
});

profileRouter.delete('/api/profile/:id', bearerAuth, function(req, res, next) {
  debug('DELETE: /api/profile/:id');

  Profile.remove({ userID:req.user._id })
  .then( () => User.remove({ userID:req.user.username }))
  //  add later, check
  // .then( () => Character.remove({ characterID:req.params.id }));
  // .then( () => Dm.remove({ dmID:req.params.id }));
  .catch(next);
});
