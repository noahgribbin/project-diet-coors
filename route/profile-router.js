'use strict';

const debug = require('debug')('dungeonManager:profile-router');
const createError = require('http-errors');
const Router = require('express').Router;
const jsonParser = require('body-parser').json();

const bearerAuth = require('../lib/bearer-auth-middleware.js');
const Profile = require('../model/profile.js');
const User = require('../model/user.js');
const Dm = require('../model/dm.js');
const Character = require('../model/character.js');

const profileRouter = module.exports = Router();

profileRouter.post('/api/profile', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/profile');
  if (!req._body) return next(createError(400, 'request body expected'));
  req.body.userID = req.user._id;
  console.log('user id',req.user._id);
  new Profile(req.body).save()
  .then( profile => {
    console.log('profile_id',profile._id);
    console.log('profile user id',profile.userID);
    User.findByIdAndUpdate(profile.userID, {$set: {profileID: profile._id}}, {new: true})
    .then( user => {
      console.log(user);
    })
    res.json(profile)
  })
  .catch(next);
});

profileRouter.get('/api/profile/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('GET: /api/profile');

  Profile.findById(req.params.id)
  .then( profile => {
    console.log(profile._id);
    console.log(profile.userID);
    res.json(profile)
  })
  .catch(next);
});
profileRouter.get('/api/profile/user/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('GET: /api/profile/user');
  User.findById(req.params.id)
  .then( user => {
    console.log(user);
    Profile.findById(user.profileID)
    .then( profile => {
      console.log(profile._id);
      console.log(profile.userID);
      res.json(profile)
    })
  })
  .catch(next);
});

profileRouter.put('/api/profile/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/profile/:id');

  if(!req._body) return next(createError(400, 'nothing to update'));

  Profile.findByIdAndUpdate(req.params.id, req.body, { new:true } )
  .then( profile => res.json(profile))
  .catch(next);
});
``
profileRouter.delete('/api/profile/:id', bearerAuth, function(req, res, next) {
  debug('DELETE: /api/profile/:id');

  Profile.findById( req.params.id )
  .then( profile => {
    User.findById(profile.userID)
    .then( user => {
      user.remove()
    })
  })
  .then( () => Profile.findById( req.params.id ))
  .then( profile => {
    profile.remove()
  })
  .then( () => Character.remove({ profileID:req.params.id }))
  .then( () => Dm.remove({ profileID: req.params.id }))
  .then( () => {
    res.status(204).send();
  })
  .catch(next);
});
