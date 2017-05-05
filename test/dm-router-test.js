'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const Profile = require('../model/profile.js');
const User = require('../model/user.js');
const Dm = require('../model/dm.js');

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

const exampleDm = {
  campaignName: 'test campaign name'
};

describe('Dm Routes', () => {
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

  describe('POST /api/dm', () => {
    afterEach( done => {
      Dm.remove({})
      .then( () => {
        delete exampleDm.profileID;
        done();
      })
      .catch(done);
    });

    describe('with a valid body', () => {
      it('should return a token', done => {
        request.post(`${url}/api/dm`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(exampleDm)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.body.dm.campaignName).to.equal('test campaign name');
          expect(res.status).to.equal(200);
          done();
        });
      });
    });
    describe('with no body', () => {
      it('should return 400 request body expected', done => {
        request.post(`${url}/api/dm`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          // expect(res.text).to.equal('request body expected');
          done();
        });
      });
    });
    describe('with no token', () => {
      it('should return 400 authorization header required', done => {
        request.post(`${url}/api/dm`)
        .send(exampleDm)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          // expect(res.text).to.equal('authorization header required');
          done();
        });
      });
    });
  });

  describe('GET api/dm/:id', () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        console.log(this.tempDm._id);
        done();
      })
      .catch(done);
    });

    afterEach( done => {
      Dm.remove({})
      .then( () => {
        delete exampleDm.profileID;
        done();
      })
      .catch(done);
    });

    describe('with a valid dm id', () => {
      it('should return a dm', done => {
        request.get(`${url}/api/dm/${this.tempDm._id.toString()}`)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          console.log(res.body);
          done();
        });
      });
    });
  });
});
