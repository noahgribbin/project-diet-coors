'use strict';

const debug = require('debug')('dungeonManager:dm-router');
const createError = require('http-errors');
const jsonParser = require('body-parser').json();
const Router = require('express').Router;

const bearerAuth = require('../lib/bearer-auth-middleware.js');

const Character = require('../model/character.js');
const Dm = require('../model/dm.js');
const Profile = require('../model/profile.js');

const dmRouter = module.exports = Router();

dmRouter.post('/api/dm', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/recipe');

  if(!req._body) return next(createError(400, 'request body expected'));

  Profile.findOne( {userID: req.user._id} )
  .then( profile => {
    req.body.profileID = profile._id;
    return new Dm(req.body).save();
  })
  .then( dm => {
    Profile.findById(dm.profileID)
    .then( profile => {
      profile.dms.push(dm._id);
      return profile.save();
    })
    .then( profile => {
      let response = { profile: profile, dm: dm };
      res.json(response);
    })
    .catch(next);
  })
  .catch(next);
});

dmRouter.get('/api/dm/:id', bearerAuth, function(req, res, next) {
  debug('GET: /api/dm/:id');
  Dm.findById(req.params.id)
  .then( dm => res.json(dm))
  .catch(next);
});

dmRouter.get('/api/dm/:id/characters', bearerAuth, function(req, res, next) {
  debug('GET: /api/dm/:id/characters');

  Dm.findById(req.params.id)
  .then( dm => {
    Character.find({ _id: { $in: dm.campaignMembers}}).lean()
    .then( characters => {
      console.log('characters'+'\n',characters);
      res.json(characters);
    })
    .catch(next);
  })
  .catch(next);

});

dmRouter.get('/api/mydms/:profileID', bearerAuth,  function(req, res, next) {
  debug('GET: /api/mydms/:profileID');

  Profile.findById(req.params.profileID)
  .populate('dms')
  .then( profile => res.json(profile))
  .catch(next);
});

dmRouter.get('/api/alldms', bearerAuth, function(req, res, next) {
  debug('GET: /api/alldms');

  Dm.find({})
  .then( dms => {
    res.json(dms);
  })
  .catch(next);
});

dmRouter.put('/api/dm/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/dm/:id');
  if (req._body !== true) return next(createError(400, 'nothing to update'));
  Dm.findByIdAndUpdate(req.params.id, req.body, { new: true })
  .then( dm => {
    res.json(dm);
  })
  .catch(next);
});

dmRouter.put('/api/dm/:id/:characterID', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/dm/:id/:characterID');

  if(req._body !== true) return next(createError(400, 'nothing to update'));

  Dm.findById(req.body[1]._id)
  .then( dm => {
    dm.campaignMembers.push(req.body[0]._id);
    res.json(dm);
  })
  .catch(next);


});

dmRouter.delete('/api/dm/:id', bearerAuth, function(req, res, next) {
  debug('DELETE: /api/dm/:id');

  Profile.findOne( {dms: req.params.id} )
  .then( profile => {
    let dmArray = profile.dms;
    let dmIndex = dmArray.indexOf(req.params.id);
    dmArray.splice(dmIndex, 1);
    return Profile.findByIdAndUpdate( profile._id, { $set: { dms: dmArray } }, { new: true });
  })
  // remove other things that exist on dm
  .then( () => {
    Dm.findByIdAndRemove(req.params.id);
    res.status(204).send();
  })
  .catch(next);
});
