'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const Character = require('../model/character.js');
const Profile = require('../model/profile.js');
const User = require('../model/user.js');

require('../server.js');

const url = `http://localhost:${process.env.PORT}`;

const exampleUser = {
  username: 'testusername',
  password: 'testpass',
  email: 'test@test.com'
};

const exampleProfile = {
  name: 'example name'
};

const exampleCharacter = {
  characterName: 'Kenith'
};

describe('Character Routers', () => {

  beforeEach( done => {
    new User(exampleUser)
    .generatePasswordHash(exampleUser.password)
    .then( user => user.save())
    .then( user => {
      this.tempUser = user;
      return user.generateToken();
    })
    .then( token => {
      this.tempToken = token;
      return;
    })
    .then( () => {
      exampleProfile.userID = this.tempUser._id.toString();
      new Profile(exampleProfile).save()
      .then( profile => {
        this.tempProfile = profile;
        done();
      })
      .catch(done);
    })
    .catch(done);
  });

  afterEach( done => {
    Promise.all([
      User.remove({}),
      Profile.remove({})
    ])
    .then( () => {
      delete exampleProfile.userID;
      delete exampleProfile.dms;
      done();
    })
    .catch(done);
  });

  
});
