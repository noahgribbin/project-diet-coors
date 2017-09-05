'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const User = require('../model/user.js');
const Profile = require('../model/profile.js');
const Dm = require('../model/dm.js');
const Character = require('../model/character.js');

require('../server.js');

const url = `http://localhost:${process.env.PORT}`;

const exampleUser = {
  username: 'testusername',
  password: 'lalala'
};
const exampleUser2 = {
  username: 'second user',
  password: 'bahahah'
};

const exampleProfile = {
  name: 'example name'
};
const exampleProfile2 = {
  name: 'profile 2'
};

const exampleDm = {
  campaignName: 'First Adventure',
  campaignCode: 'testcode'
}

const exampleCharacter =  {
  characterName: 'Todd1'
}
const exampleCharacter2 =  {
  characterName: 'Ben'
}

const updatedCharacter = {
  characterName: 'Todd2'
}

describe('Character Routes', () => {
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
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        done();
      })
      .catch(done);
    })

  beforeEach( done => {
    exampleCharacter.profileID = this.tempProfile._id;
    new Character(exampleCharacter).save()
    .then( character => {
      this.tempCharacter = character;
      done();
    })
    .catch(done)
  })

  afterEach( done => {
    Promise.all([
      User.remove({}),
      Profile.remove({}),
      Dm.remove({}),
      Character.remove({})
    ])
    .then( () => {
      delete exampleProfile.userID;
      delete exampleDm.profileID;
      delete exampleCharacter.profileID;
      delete exampleCharacter.dmID;
      done();
    })
    .catch(done);
  });

  describe(`POST ${url}/api/character`, () => {
    describe('with a valid body', () => {
      it('should create a character', done => {
        request.post(`${url}/api/character`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(exampleCharacter)
        .end((err, res) => {
          if(err) return done(err);
          console.log('this in test',this);
          expect(res.status).to.equal(200);
          expect(res.body.characterName).to.equal(exampleCharacter.characterName);
          done();
        });
      });
    });
  });


  describe(`POST ${url}/api/character/:dmcode`, () => {
    beforeEach( done => {

      new User(exampleUser2)
      .generatePasswordHash(exampleUser2.password)
      .then( user => user.save())
      .then( user => {
        this.tempUser2 = user
        return user.generateToken();
      })
      .then( token => {
        this.tempToken2 = token;
      })
      .then( () => {
        exampleProfile2.userID = this.tempUser2._id.toString();
        new Profile(exampleProfile2).save()
        .then( profile => {
          this.tempProfile2 = profile
          done()
        })
        .catch(done)
      })
      .catch(done);
    })

    beforeEach( done => {
      exampleCharacter2.profileID = this.tempProfile2._id
      new Character(exampleCharacter2).save()
      .then( character => {
        this.tempCharacter2 = character;
        done()
      })
      .catch(done)
    });

    describe('with a valid dmcode and id', () => {
      it('should add a character id to a dm party', done => {
        request.post(`${url}/api/character/${this.tempDm.campaignCode}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(this.tempCharacter2)
        .end((err, res) => {
          if(err) return done(err)
          expect(res.status).to.equal(200);
          done()
        })
      })
    })
  })

  describe(`GET ${url}/api/character/:id`, () => {
    describe('with a valid character id', () => {
      it('should return a character', done => {
        request.get(`${url}/api/character/${this.tempCharacter._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if(err) return done(err)
          expect(res.status).to.equal(200);
          expect(res.body.characterName).to.equal(exampleCharacter.characterName);
          done()
        })
      })
    })
  })

  describe(`GET ${url}/api/characters/:profileID`, () => {
    beforeEach(done => {
      this.tempProfile.characters.push(this.tempCharacter._id);
      Profile.findByIdAndUpdate(this.tempProfile._id, { $set: {characters: this.tempProfile.characters}}, { new: true })
      .then( profile => {
        console.log(profile);
        done()
      })
      .catch(done)
    })
    describe('with a valid profile id', () => {
      it('should return a list of all characters in a profile', done => {
        request.get(`${url}/api/characters/${this.tempProfile._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if(err) return done(err)
          expect(res.status).to.equal(200);
          console.log('res.body',res.body.characters);

          expect(res.body.characters[0].characterName).to.equal(this.tempCharacter.characterName);
          expect(res.body.characters[0]._id).to.equal(this.tempCharacter._id.toString());
          expect(res.body.characters[0].profileID).to.equal(this.tempCharacter.profileID.toString());
          done();
        });
      });
    });
  });


    describe(`GET ${url}/api/character/party/:id`, () => {
      beforeEach( done => {
        new User(exampleUser2)
        .generatePasswordHash(exampleUser2.password)
        .then( user => user.save())
        .then( user => {
          this.tempUser2 = user
          return user.generateToken();
        })
        .then( token => {
          this.tempToken2 = token;
          done()
        })
        .catch(done)
      })


      beforeEach( done => {
          exampleProfile2.userID = this.tempUser2._id.toString();
          new Profile(exampleProfile2).save()
          .then( profile => {
            this.tempProfile2 = profile
            done()
          })
          .catch(done)
        })

      beforeEach( done => {
       exampleCharacter2.profileID = this.tempProfile2._id
       exampleCharacter2.dmID = this.tempDm._id
       new Character(exampleCharacter2).save()
       .then( character => {
         this.tempCharacter2 = character;
         done()
       })
       .catch(done)
     });
     beforeEach( done => {
       this.tempDm.campaignMembers.push(this.tempCharacter2._id, this.tempCharacter._id)
       Dm.findByIdAndUpdate(this.tempDm._id, {$set: {campaignMembers: this.tempDm.campaignMembers}}, {new:true})
       .then( dm => {
         console.log('dm',dm);
         done();
       })
       .catch(done);
     })
      describe('with a valid character id', () => {
        it('should return an array of characters', done => {
          request.get(`${url}/api/character/party/${this.tempCharacter2._id}`)
          .set({ Authorization: `Bearer ${this.tempToken}`})
          .end((err, res) => {
            if(err) return done(err)
            console.log('res.body', res.body);
            expect(res.status).to.equal(200)
            done()
          })
        })
      })
    })


  describe(`PUT ${url}/api/character/:id`, () => {
    describe('with a valid character id and body', () => {
      it('should update a character', done => {
        request.put(`${url}/api/character/${this.tempCharacter._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .send(updatedCharacter)
        .end((err, res) => {
          if(err) return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.characterName).to.equal(updatedCharacter.characterName)
          done();
        });
      });
    });
  });

  describe(`DELETE ${url}/api/character/:id`, () => {
    describe('with a valid character id', () => {
      it('should delete a character', done => {
        request.delete(`${url}/api/character/${this.tempCharacter._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if(err) return done(err)
          console.log('this in test',this);
          expect(res.status).to.equal(204)
          done();
        });
      });
    });
  });

});
