'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const Dm = require('../model/dm.js');
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

const exampleCharacter2 = {
  characterName: 'Bones'
};

const exampleDm = {
  campaignName: 'Test campaign name'
};
const invalidID = 'ay2Usn68j9fbYtn5';

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
        console.log('|||tempProfileID|||',this.tempProfile._id.toString());
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

  describe('POST /api/character', () => {
    afterEach( done => {
      Character.remove({})
      .then( () => {
        delete exampleCharacter.profileID;
        done();
      })
      .catch(done);
    });

    describe('with a valid body', () => {
      it('should return a token', done => {
        request.post(`${url}/api/character`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(exampleCharacter)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('without a valid body', () => {
      it('should return 400 expected body', done => {
        request.post(`${url}/api/character`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });

  });

  describe('GET /api/character/:id', () => {
    beforeEach( done => {
      exampleCharacter.profileID = this.tempProfile._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        console.log(this.tempCharacter._id);
        done();
      })
      .catch(done);
    });

    afterEach( done => {
      Character.remove({})
      .then( () => {
        delete exampleCharacter.profileID;
        done();
      })
      .catch(done);
    });

    describe('with a valid character id', () => {
      it('should return a character', done => {
        request.get(`${url}/api/character/${this.tempCharacter._id}`)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('with an invalid character id', () => {
      it('should return a character', done => {
        request.get(`${url}/api/character/${invalidID}`)
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });

  });

  describe('GET /api/mycharacters/:profileID', () => {

    beforeEach( done => {
      exampleCharacter.profileID = this.tempCharacter._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        this.tempProfile.characters.push(this.tempCharacter._id);
        return Profile.findByIdAndUpdate(this.tempProfile._id, {$set:{characters:this.tempProfile.characters}},{new:true});
      })
      .then( () => done())
      .catch(done);
    });

    afterEach( done => {
      Character.remove({})
      .then( () => {
        delete exampleCharacter.profileID;
        done();
      })
      .catch(done);
    });

    describe('with a valid profile id', () => {
      it('should return a list of characters', done => {
        request.get(`${url}/api/mycharacters/${this.tempProfile._id.toString()}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('with an invalid profile id', () => {
      it('should retun 404 not found', done => {
        request.get(`${url}/api/mycharacters/${invalidID}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });

    describe('without headers', () => {
      it('should return 400 headers required', done => {
        request.get(`${url}/api/mycharacters/${this.tempProfile._id.toString()}`)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });

  });


  describe('GET /api/partymembers/:id', () => {

    beforeEach( done => {
      exampleCharacter.profileID = this.tempProfile._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        done();
      })
      .catch(done);
    });

    beforeEach( done => {
      exampleCharacter2.profileID = this.tempProfile._id;
      new Character(exampleCharacter2).save()
      .then( character => {
        this.tempCharacter2 = character;
        done();
      })
      .catch(done);
    });

    beforeEach( done => {
      exampleDm.campaignMembers = [this.tempCharacter._id];
      exampleDm.campaignMembers.push(this.tempCharacter2._id);
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        done();
      })
      .catch(done);
    });

    beforeEach( done => {
      Character.findById(this.tempCharacter._id)
      .then( character => {
        character.dmID = this.tempDm._id;
        character.save();
        done();
      })
      .catch(done);
    });

    beforeEach( done => {
      Character.findById(this.tempCharacter2._id)
      .then( character => {
        character.dmID = this.tempDm._id;
        character.save();
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

    afterEach( done => {
      Character.remove({})
      .then( () => {
        delete exampleCharacter.profileID;
        delete exampleCharacter2.profileID;
        done();
      })
      .catch(done);
    });

    describe('with a vaild character id', () => {
      it('should return an array of characters', done => {
        request.get(`${url}/api/partymembers/${this.tempCharacter._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          console.log('res.body'+'\n', res.body);
          expect(res.body[0].characterName).to.equal(this.tempCharacter.characterName);
          expect(res.body[1].characterName).to.equal(this.tempCharacter2.characterName);
          expect(res.body[0].profileID).to.equal(this.tempCharacter.profileID.toString());
          expect(res.body[1].profileID).to.equal(this.tempCharacter2.profileID.toString());
          expect(res.body[0].dmID).to.equal(this.tempDm._id.toString());
          expect(res.body[1].dmID).to.equal(this.tempDm._id.toString());
          done();
        });
      });
    });

  });

  describe('PUT /api/character/:id', () => {
    beforeEach( done => {
      exampleCharacter.profileID = this.tempProfile._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        done();
      })
      .catch(done);
    });

    afterEach( done => {
      Character.remove({})
      .then( () => {
        delete exampleCharacter.profileID;
        done();
      })
      .catch(done);
    });

    const updatedCharacter = {
      characterName: 'updated name'
    };

    describe('with a valid character id and body', () => {
      it('should return an updated character', done => {
        request.put(`${url}/api/character/${this.tempCharacter._id.toString()}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(updatedCharacter)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('with a valid id, and invalid body', () => {
      it('should return 400 request body expected', done => {
        request.put(`${url}/api/character/${this.tempCharacter._id.toString()}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });

    describe('with an invalid id and a valid body', () => {
      it('should return 404 not found', done => {
        request.put(`${url}/api/characters/${invalidID}`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .send(updatedCharacter)
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });

    describe('without headers', () => {
      it('should return ', done => {
        request.put(`${url}/api/character/${this.tempCharacter._id.toString()}`)
        .send(updatedCharacter)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });

  });

  describe('DELETE /api/character/:id', () => {
    beforeEach( done => {
      exampleCharacter.profileID = this.tempProfile._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        this.tempProfile.characters.push(this.tempCharacter._id);
        return Profile.findByIdAndUpdate(this.tempProfile._id, { $set: { characters: this.tempProfile.characters } }, { new: true } );
      })
      .then( () => done())
      .catch(done);
    });

    afterEach( done => {
      Character.remove({})
      .then( () => {
        delete exampleCharacter.profileID;
        done();
      })
      .catch(done);
    });

    describe('with a valid character id', () => {
      it('should delete the character and return a 204 status', done => {
        request.delete(`${url}/api/character/${this.tempCharacter._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(204);
          Profile.findById(this.tempProfile._id)
          .then( profile => {
            expect( profile.characters.indexOf(this.tempCharacter._id)).to.equal(-1);
            done();
          })
          .catch(done);
        });
      });
    });

    describe('with an invalid character id', () => {
      it('should return 404 not found', done => {
        request.delete(`${url}/api/character/${invalidID}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });

    describe('without auth headers', () => {
      it('should return 401 auth headers required', done => {
        request.delete(`${url}/api/character/${this.tempCharacter._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });



  });
});
