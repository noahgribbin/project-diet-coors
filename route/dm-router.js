'use strict'

const debug = require('debug')('dungeonManager:dm-router');
const createError = require('http-errors');
const Router = require('express').Router;
const jsonParser = require('body-parser').json();

const bearerAuth = require('../lib/bearer-auth-middleware.js');
const User = require('../model/user.js');
const Profile = require('../model/profile.js');
const Dm = require('../model/dm.js');
const Spell = require('../model/spell.js');
const Armor = require('../model/armor.js');
const Weapon = require('../model/weapon.js');

const dmRouter = module.exports = Router();

dmRouter.post('/api/dm', bearerAuth, jsonParser, function (req, res, next) {
  debug('POST: /api/dm');
  if (!req._body) return next(createError(400, 'request body expected'));
  Profile.findOne( {userID: req.user._id})
  .then( profile => {
    req.body.profileID = profile._id;

    var text = "";
    console.log('text',text);
    function createCode() {
      var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (var i = 0; i < 4; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
        console.log('text in loop', text);
      }
      Dm.findOne({campaignCode:text}, function(err, found) {
        if(found){
        text = '';
        createCode();
        }
      })

      return text;
    }
    createCode()
    console.log('text',text);
    req.body.campaignCode = text
    return new Dm(req.body).save();
  })
  .then( dm => {
    console.log(dm);
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
    res.json(dm)
  })
  .catch(next);
});

dmRouter.get('/api/dms/:profileID', bearerAuth, jsonParser, function(req,res,next) {
debug('GET: /api/dms/:profileID');
Profile.findById(req.params.profileID)
.populate('dms')
.then( profile => {
  // console.log(profile);
  res.json(profile)
})
.catch(next);
// no test
})

dmRouter.get('/api/dm/party/:id', bearerAuth, jsonParser, function (req, res, next) {
  debug('GET: /api/dm/:id')

    Dm.findById(req.params.id)
    .then(dm => {
      console.log('dm',dm);
    })
  Dm.findById(req.params.id)
  .populate({
    path: 'campaignMembers',
    model: 'Character',
    populate:[{
      path: 'weapons',
      model: 'Weapon'
    },
    {
      path: 'armor',
      model: 'Armor'
    },
    {
       path: 'spells',
       model: 'Spell'
     }]
  })
  .then( dm => {
    console.log('dm:',dm.campaignMembers);
    res.json(dm)
  })
  .catch(next);
})

dmRouter.put('/api/dm/:id', bearerAuth, jsonParser, function (req, res, next) {
  debug('PUT: /api/dm/:id');
  if (!req._body) return next(createError(400, 'request body expected'));

  Dm.findByIdAndUpdate(req.params.id, {
     $set: {campaignName: req.body.campaignName}}, {new:true})
  .then( dm => {
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
    .then(() => {
      Profile.findOne({ userID: req.user._id})
      .populate('dms')
      .then( profile => {
        res.json(profile.dms)
      })
    })
    .catch(next);
  });
});
