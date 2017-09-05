'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const Dm = require('../model/dm.js');
const User = require('../model/user.js');
const Profile = require('../model/profile.js');
const Character = require('../model/character.js');

require('../server.js');

const url = `http://localhost:${process.env.PORT}`;

const exampleUser = {
  username: 'testusername',
  password: 'lalala'
};

const exampleProfile = {
  name: 'example name'
};

const exampleDm = {
  campaignName: 'First Adventure',
  campaignCode: 'testcode'
}

const updatedDm = {
  campaignName: 'New Exciting Adventure',
  campaignCode: 'testcode'
}

const exampleCharacter =  {
  characterName: 'Todd1'
}

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
      done();
    })
    .catch(done);
  });

  describe(`POST ${url}/api/dm`, () => {
    afterEach(done => {
      Dm.remove({})
      .then( () => {
        delete exampleDm.profileID;
        done();
      })
      .catch(done);
    });
    describe('with a valid body', () => {
      it('should return a dm', done => {
        request.post(`${url}/api/dm`)
        .set( {Authorization: `Bearer ${this.tempToken}`})
        .send(exampleDm)
        .end((err, res) => {
          // console.log('res'+'\n',res.body);
          if(err) return done(err);
          // console.log('post res body',res.body);
          expect(res.status).to.equal(200);
          expect(res.body.dm.campaignName).to.equal(exampleDm.campaignName);
          done();
        });
      });
    });
  });

  describe(`GET ${url}/api/dm/:id`, () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        console.log('get dm', dm);
        this.tempDm = dm;
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
    describe('with a valid id', () => {
      it('should return a dm', done => {
        request.get(`${url}/api/dm/${this.tempDm._id.toString()}`)
        .set( {Authorization: `Bearer ${this.tempToken}`})
        .end((err,res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          console.log(this.tempDm._id);
          expect(res.body.campaignName).to.equal(exampleDm.campaignName);
          done();
        });
      });
    });
  });

  describe(`GET ${url}/api/dm/party/:id`, () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        done();
      })
      .catch(done)
    });
    beforeEach( done => {
      exampleCharacter.profileID = this.tempProfile._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        done();
      })
      .catch(done)
    });
    beforeEach( done => {
      this.tempDm.campaignMembers.push(this.tempCharacter._id);
      Dm.findByIdAndUpdate(this.tempDm._id, { $set: {campaignMembers: this.tempDm.campaignMembers}}, {new:true})
      .then( dm => {
        console.log('dm',dm);
        done()
      })
      .catch(done)
    })
    afterEach( done => {
      Promise.all([
        Dm.remove({}),
        Character.remove({})
      ])
      .then( () => {
        delete exampleDm.profileID;
        delete exampleCharacter.profileID;
        delete exampleCharacter.dmID;
        done();
      })
      .catch(done);
    });
    describe('with a calid dm id', () => {
      it('should return an array of characters', done => {
        request.get(`${url}/api/dm/party/${this.tempDm._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if(err) return done(err)
          console.log('res.body',res.body);
          expect(res.status).to.equal(200);
          expect(res.body.campaignMembers [0].characterName).to.equal(exampleCharacter.characterName);
          done();
        })
      })
    })
  })


  describe(`PUT ${url}/api/dm/:id`, () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        done();
      })
      .catch(done)
    });
    afterEach( done => {
      Dm.remove({})
      .then( () => {
        delete exampleDm.profileID;
        done()
      })
      .catch(done);
    });
    describe('with a valid id', () => {
      it('should return an updated dm', done => {
        request.put(`${url}/api/dm/${this.tempDm._id.toString()}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(updatedDm)
        .end((err,res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.campaignName).to.equal('New Exciting Adventure');
          done();
        });
      });
    });
  });

  describe(`DELETE ${url}/api/dm/:id`, () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        console.log('this.tempDm', this.tempDm);
        done();
      })
      .catch(done);
    });
    afterEach( done => {
      Dm.remove({})
      .then( () => {
        delete exampleDm.profileID;
        done()
      })
      .catch(done);
    });
    describe('with a valid id', () => {
      it('should delete a dm', done => {
        request.delete(`${url}/api/dm/${this.tempDm._id.toString()}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(204);
          Dm.findById(this.tempDm._id, function(err, found) {
            console.log('found dm',found);
            expect(found).to.equal(null)
          })
          done();
        });
      });
    });
  });

});
