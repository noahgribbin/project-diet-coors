'use strict';

const debug = require('debug')('dungeonManager:character-router');
const createError = require('http-errors');
const Router = require('express').Router;
const jsonParser = require('body-parser').json();

const bearerAuth = require('../lib/bearer-auth-middleware.js');
const User = require('../model/user.js');
const Dm = require('../model/dm.js');
const Profile = require('../model/profile.js');
const Character = require('../model/character.js');

const characterRouter = module.exports = Router();

characterRouter.post('/api/character', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character');
  if (!req._body) return next(createError(400, 'request body expected'));
  Profile.findOne({ userID: req.user._id})
  .then( profile => {
    req.body.profileID = profile._id;
    return new Character(req.body).save();
  })
  .then( character => {
    Profile.findById(character.profileID)
    .then( profile => {
      profile.characters.push(character._id)
      return profile.save();
    })
    .then( () => {
      res.json(character)
    })
    .catch(next);
  })
  .catch(next);
});

characterRouter.post('/api/character/:dmcode', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character/:dmcode')
  Dm.findOne({campaignCode: req.params.dmcode})
  .then( dm => {
    console.log('dm', dm);
    dm.campaignMembers.push(req.body._id)
    res.json(dm)
  })
})

characterRouter.get('/api/character/:id', bearerAuth, jsonParser, function(req,res,next) {
  debug('GET: /api/character/:id')
  Character.findById(req.params.id)
  .then( character => {
    res.json(character);
  })
  .catch(next);
})

characterRouter.get('/api/characters/:profileID', bearerAuth, jsonParser, function(req,res, next) {
  debug('GET: /api/character/:profileID')
  Profile.findById(req.params.profileID)
  .populate('characters')
  .then( profile => res.json(profile))
  .catch(next);
})

characterRouter.get('/api/character/party/:id', bearerAuth, jsonParser, function(req,res,next) {
  debug('GET: /api/character/party/:id')
  Character.findById(req.params.id)
  .then( character => {
    console.log('character', character);
    Dm.findById(character.dmID)
    .populate('campaignMembers')
    .then( dm => res.json(dm.campaignMembers))
  })
})

characterRouter.put('/api/character/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/character/:id')
  if (!req._body) return next(createError(400, 'request body expected'))

  Character.findByIdAndUpdate(req.params.id, req.body, { new: true })
  .then( character => res.json(character))
  .catch(next);
})

characterRouter.delete('/api/character/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('DELETE: /api/character/:id')

  Character.findByIdAndRemove(req.params.id, function() {
    Profile.findOne({ userID: req.user._id })
    .then( profile => {
      let characterArray = profile.characters;
      let characterIndex = characterArray.indexOf(req.params.id);
      characterArray.splice(characterIndex, 1);
      return Profile.findByIdAndUpdate( profile._id, { $set: {characters: characterArray} }, { new: true } );
    })
    .then( () => {
      res.status(204).send();
    })
    .catch(next)
  });
})
