'use strict'

const debug = require('debug')('dungeonManager:dm-router');
const createError = require('http-errors');
const Router = require('express').Router;
const jsonParser = require('body-parser').json();

const bearerAuth = require('../lib/bearer-auth-middleware.js');
const User = require('../model/user.js');
const Profile = require('../model/profile.js');
const Dm = require('../model/dm.js');

const dmRouter = module.exports = Router();

dmRouter.post('/api/dm', bearerAuth, jsonParser, function (req, res, next) {
  debug('POST: /api/dm');
  if (!req._body) return next(createError(400, 'request body expected'));
  Profile.findOne( {userID: req.user._id})
  .then( profile => {
    req.body.profileID = profile._id;
    return new Dm(req.body).save();
  })
  .then( dm => {
    Profile.findById(dm.profileID)
    .then( profile => {
      profile.dms.push(dm._id)
      return profile.save();
    })
    .then( profile => {
      let response = { profile: profile, dm: dm };
      res.json(response)
    })
    .catch(next);
  })
  .catch(next);
})

dmRouter.get('/api/dm/:id', bearerAuth, jsonParser, function (req, res, next) {
  debug('GET: /api/dm/:id');
  Dm.findById(req.params.id)
  .then( dm => {
    console.log('dm', dm);
    console.log(req.params);
    res.json(dm)
    // console.log('dm grabbed by profile', dm);
  })
  .catch(next);
});

dmRouter.get('/api/dm/party/:id', bearerAuth, jsonParser, function (req, res, next) {
  debug('GET: /api/dm/:id')
  Dm.findById(req.params.id)
  .populate('campaignMembers')
  .then( dm => {
    console.log('dm',dm);
    res.json(dm)
  })
  .catch(next);
})

dmRouter.put('/api/dm/:id', bearerAuth, jsonParser, function (req, res, next) {
  debug('PUT: /api/dm/:id');
  console.log('req.body', req.body);
  if (!req._body) return next(createError(400, 'request body expected'));

  Dm.findByIdAndUpdate(req.params.id, req.body, {new:true})
  .then( dm => {
    console.log('dm in uppdate route',dm);
    res.json(dm)
  })
  .catch(next)

})

dmRouter.delete('/api/dm/:id', bearerAuth, function (req, res, next) {
  debug('DELETE: /api/dm/:id');

  Dm.findByIdAndRemove(req.params.id, function() {
    Profile.findOne({ userID: req.user._id})
    .then( profile => {
      let dmArray = profile.dms;
      let dmIndex = dmArray.indexOf(req.params.id)
      dmArray.splice(dmIndex, 1);
      return Profile.findByIdAndUpdate(profile._id, {$set: { dms: dmArray }}, {new: true} );
    })
    .then( () => {
      res.status(204).send();
    })
    .catch(next);
  });
});
