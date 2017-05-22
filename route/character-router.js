'use strict';

const debug = require('debug')('dungeonManager:character-router');
const createError = require('http-errors');
const jsonParser = require('body-parser').json();
const Router = require('express').Router;

const bearerAuth = require('../lib/bearer-auth-middleware.js');
const Character = require('../model/character.js');
const Profile = require('../model/profile.js');

const characterRouter = module.exports = Router();

characterRouter.post('/api/character', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character');

  if(!req._body) return next(createError(400, 'request body expected'));

  Profile.findOne( {userID: req.user._id} )
  .then( profile => {
    req.body.profileID = profile._id;
    return new Character(req.body).save();
  })
  .then( character => {
    Profile.findById(character.profileID)
    .then( profile => {
      profile.characters.push(character._id);
      return profile.save();
    })
    .then( profile => {
      let response = { profile: profile, character: character};
      res.json(response);
    })
    .catch(next);
  })
  .catch(next);
});

characterRouter.get('/api/character/:id', function(req, res, next) {
  debug('GET: /api/character/:id');

  Character.findById(req.params.id)
  .then( character => res.json(character))
  .catch(next);
});

characterRouter.get('/api/mycharacters/:profileID', bearerAuth, function(req, res, next) {
  debug('GET: /api/mycharacters/:profileID');

  Profile.findById(req.params.profileID)
  .populate('characters')
  .then( profile => res.json(profile))
  .catch(next);
});

characterRouter.put('/api/character/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/character/:id');
  if( req._body !== true) return next(createError(400, 'nothing to update'));
  Character.findByIdAndUpdate(req.params.id, req.body, { new: true })
  .then( character => {
    res.json(character);
  })
  .catch(next);
});


characterRouter.delete('/api/character/:id', bearerAuth, function(req, res, next) {
  debug('DELETE: /api/recipe/:id');

  Profile.findOne( {characters: req.params.id} )
  .then( profile => {
    console.log(profile);
    let characterArray = profile.characters;
    let characterIndex = characterArray.indexOf(req.params.id);
    characterArray.splice(characterIndex, 1);
    return Profile.findByIdAndUpdate( profile._id, { $set: { characters: characterArray } }, { new: true} );
  })
  .then( () => {
    Character.findByIdAndRemove(req.params.id);
    res.status(204).send();
  })
  .catch(next);
});
