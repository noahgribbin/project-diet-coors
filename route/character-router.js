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
const Weapon = require('../model/weapon.js');
const Armor = require('../model/armor.js');
const Spell = require('../model/spell.js');

const characterRouter = module.exports = Router();

characterRouter.post('/api/character', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character');
  if (!req._body) return next(createError(400, 'request body expected'));
  console.log('req.body', req.body);
  Profile.findOne({ userID: req.user._id})
  .then( profile => {
    console.log(profile);
    req.body.profileID = profile._id;
    return new Character(req.body).save();
  })
  .then( character => {

    console.log('just added stuff',character);
    character.save();
    Profile.findById(character.profileID)
    .then( profile => {
      profile.characters.push(character._id)
      return profile.save();
    })
    .then( () => {
      console.log(character);
      res.json(character)
    })
    .catch(next);
  })
  .catch(next);
});

characterRouter.post('/api/character/:dmcode', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character/:dmcode')
  var validCode = true;
    Dm.findOne({campaignCode: req.params.dmcode}, function(err, found){
      if(err){
        console.log(err);
      }
      if(found){
        console.log("FOUND");
        console.log(found);
      }else {
        console.log('NOT FOUND');
        validCode = false;
        res.status(404).end()
      }
    })


  Character.findById(req.body.id)
  .populate('dmID')
  .then(character => {
    if(character.dmID){
      if(character.dmID.campaignCode === req.params.dmcode){
        res.status(400).send('already joined')
      }  
    }
  })
  .catch(next)

  Dm.findOne({campaignCode: req.params.dmcode}, function(err, found) {
    if(found){
      Character.findById(req.body.id)
      .populate('dmID')
      .then(character => {
        if(character.dmID){
          Dm.findById(character.dmID)
          .then(dm => {
            console.log('old dm', dm);
            let memberArray = dm.campaignMembers
            let idIndex= memberArray.indexOf(req.body.id)
            dm.campaignMembers.splice(idIndex, 1);
            Dm.findByIdAndUpdate(dm._id, {$set: {campaignMembers: memberArray}}, {new: true})
            .then(dm => {
              console.log('afterUpdateDm',dm);
            })
            .catch(next)
          })
          .catch(next)
        }
      })
      .catch(next)

    }else {

    }
  })
  //  DONE: Add character to campaign member array
  Dm.findOne({campaignCode: req.params.dmcode}, function(err, found) {
    if(found){
      console.log(found);
      // Dm.findOne({campaignCode: req.params.dmcode})
      // .then( dm => {
        // console.log(dm);
        found.campaignMembers.push(req.body.id)
        found.save();
        Character.findById(req.body.id)
        .then(character => {
          character.dmID = found._id
          character.save()
          console.log(character);
        })
        .then(() => {
          console.log(found);
          res.json(found)
        })
        .catch(next)

    }else {
      console.log('NOT FOUND!!!!!!');
    }
  })

})

characterRouter.post('/api/character/:id/weapon', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character/:id/weapon')
  Character.findById(req.params.id)
  .then( character => {
    req.body.characterID = character._id;
    console.log('make weapon body',req.body);
    return new Weapon(req.body).save();
  })
  .then( weapon => {
    console.log(weapon);
    Character.findById(weapon.characterID)
    .then( character => {
      console.log(character);
      character.weapons.push(weapon._id)
      return character.save();
    })
    .then( () => {
      // console.log(character);
      res.json(weapon)
    })
    .catch(next);
  })
  .catch(next);
})

characterRouter.post('/api/character/:id/armor', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character/:id/armor')
  Character.findById(req.params.id)
  .then( character => {
    req.body.characterID = character._id;
    return new Armor(req.body).save();
  })
  .then( armor => {
    Character.findById(armor.characterID)
    .then(character => {
      character.armor.push(armor._id)
      console.log(character);
      return character.save();
    })
    .then( () => {
      res.json(armor);
    })
    .catch(next);
  })
  .catch(next);
})

characterRouter.post('/api/character/:id/spell', bearerAuth, jsonParser, function(req, res, next) {
  debug('POST: /api/character/:id/spell')
  Character.findById(req.params.id)
  .then( character => {
    req.body.characterID = character._id;
    return new Spell(req.body).save()
  })
  .then( spell => {
    console.log('spell',spell);
    Character.findById(spell.characterID)
    .then( character => {
      character.spells.push(spell._id)
      return character.save();
    })
    .then( () => {
        res.json(spell)
    })
    .catch(next)
  })
  .catch(next)
})

characterRouter.get('/api/character/:id', bearerAuth, jsonParser, function(req,res,next) {
  debug('GET: /api/character/:id')
  console.log("req.params",req.params);
  Character.findById(req.params.id)
  .populate('dmID')
  .then( character => {
    console.log('character',character);
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
      console.log(dm);
      res.json(dm)
    })
  })
})

characterRouter.get('/api/character/:id/weapons', bearerAuth, jsonParser, function(req, res, next) {
  debug('GET: /api/character/:id/weapons')
  Character.findById(req.params.id)
  .populate('weapons')
  .then( character =>  {
    console.log(character);
    console.log('character',character.weapons);
  res.json(character.weapons)
})

})

characterRouter.get('/api/character/:id/armor', bearerAuth, jsonParser, function(req, res, next) {
  debug('GET: /api/character/:id/armor')
  Character.findById(req.params.id)
  .populate('armor')
  .then( character => res.json(character.armor))
})

characterRouter.get('/api/character/:id/spells', bearerAuth, jsonParser, function(req, res, next) {
  debug('GET: /api/character/:id/spells')
  Character.findById(req.params.id)
  .populate('spells')
  .then( character => res.json(character.spells))
})

characterRouter.put('/api/character/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/character/:id')
  console.log(req.body);
  if (!req._body) return next(createError(400, 'request body expected'))
  Character.findByIdAndUpdate(req.params.id,{
    "$set": { characterName: req.body.characterName,
            race: req.body.race,
            class: req.body.class,
            lv: req.body.lv,
            ac: req.body.ac,
            hp: req.body.hp,
            strength: req.body.strength,
            dexterity: req.body.dexterity,
            constitution: req.body.constitution,
            intelligence: req.body.intelligence,
            wisdom: req.body.wisdom,
            charisma: req.body.charisma
          }}, { new: true })

  .then( character => {
    console.log('character after update', character);
   res.json(character)
 })

  .catch(next);
})

characterRouter.put('/api/character/weapon/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/character/weapon/:id')
  if (!req._body) return next(createError(400, 'request body expected'))
  console.log(req.params.id);
  Weapon.findByIdAndUpdate(req.params.id, req.body, {new:true})
  .then(weapon => res.json(weapon))
  .catch(next)
})
characterRouter.put('/api/character/armor/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/character/armor/:id')
  if (!req._body) return next(createError(400, 'request body expected'))

  Armor.findByIdAndUpdate(req.params.id, req.body, {new:true})
  .then(armor => res.json(armor))
  .catch(next)
})
characterRouter.put('/api/character/spell/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT: /api/character/spell/:id')
  if (!req._body) return next(createError(400, 'request body expected'))

  Spell.findByIdAndUpdate(req.params.id, req.body, {new:true})
  .then(spell => res.json(spell))
  .catch(next)
})

characterRouter.delete('/api/character/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('DELETE: /api/character/:id')
  Character.findById(req.params.id)
  .then( character => {
    if(character.dmID) {
      Dm.findById(character.dmID)
      .then( dm => {
        let dmCharacterArray = dm.campaignMembers;
        let dmCharacterIndex = dmCharacterArray.indexOf(req.params.id);
        dmCharacterArray.splice(dmCharacterIndex, 1);
        return Dm.findByIdAndUpdate(dm._id, { $set: {campaignMembers: dmCharacterArray} }, { new:true });
      })
    }
  })
  Character.findByIdAndRemove(req.params.id, function() {
    Profile.findOne({ userID: req.user._id })
    .then( profile => {
      let characterArray = profile.characters;
      let characterIndex = characterArray.indexOf(req.params.id);
      characterArray.splice(characterIndex, 1);
      return Profile.findByIdAndUpdate( profile._id, { $set: {characters: characterArray} }, { new: true });
    })

    .then( () => {
      res.status(204).send();
    })
    .catch(next)
  });
})

characterRouter.delete('/api/character/weapon/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('DELETE: /api/character/weapon')
  Weapon.findById(req.params.id)
  .then( weapon => {
    Character.findById(weapon.characterID)
    .then( character => {
      let weaponArray = character.weapons;
      let weaponIndex = weaponArray.indexOf(req.params.id);
      weaponArray.splice(weaponIndex, 1);
      return Character.findByIdAndUpdate(character._id, {$set: {weapons: weaponArray}}, {new: true});
    })
    .then( () => {
      Weapon.findByIdAndRemove(req.params.id, function(err, doc) {
        console.log('findByIdAndRemove Doc', doc);
        Character.findById(doc.characterID)
        .populate('weapons')
        .then( character => {
          res.json(character.weapons)
        })
      })
    })
    .catch(next)
  })
  .catch(next)
})

characterRouter.delete('/api/character/armor/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('DELETE: /api/character/armor')
  Armor.findById(req.params.id)
  .then( armor => {
    Character.findById(armor.characterID)
    .then( character => {
      let armorArray = character.armor;
      let armorIndex = armorArray.indexOf(req.params.id);
      armorArray.splice(armorIndex, 1);
      return Character.findByIdAndUpdate(character._id, {$set: {armor: armorArray}}, {new: true});
    })
    .then( () => {
      Armor.findByIdAndRemove(req.params.id, function(err, doc) {
        console.log('findByIdAndRemove Doc', doc);
        Character.findById(doc.characterID)
        .populate('armor')
        .then(character => {
          console.log(character.armor);
          res.json(character.armor)
        })
      })
    })
    .catch(next)
  })
  .catch(next)
})

characterRouter.delete('/api/character/spell/:id', bearerAuth, jsonParser, function(req, res, next) {
  debug('DELETE: /api/character/spell')
  Spell.findById(req.params.id)
  .then( spell => {
    Character.findById(spell.characterID)
    .then( character => {
      let spellArray = character.spells;
      let spellIndex = spellArray.indexOf(req.params.id);
      spellArray.splice(spellIndex, 1);
      return Character.findByIdAndUpdate(character._id, {$set: {spells: spellArray}}, {new: true});
    })
    .then( () => {
      Spell.findByIdAndRemove(req.params.id, function(err, doc) {
        console.log('findByIdAndRemove Doc', doc);
        Character.findById(doc.characterID)
        .populate('spells')
        .then( character => {
          console.log('characterSpells:', character.spells);
          res.json(character.spells)
        })
      })
    })
    .catch(next)
  })
  .catch(next)
})
