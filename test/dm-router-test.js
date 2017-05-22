'use strict';

const expect = require('chai').expect;
const request = require('superagent');

const Character = require('../model/character.js');
const Dm = require('../model/dm.js');
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

const exampleDm = {
  campaignName: 'test campaign name'
};

const exampleCharacter = {
  characterName: 'Kenith'
};
const exampleCharacter2 = {
  characterName: 'Bones'
};

const invalidID = 'ay2Usn68j9fbYtn5';


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
      it('should return 401 authorization header required', done => {
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
        request.get(`${url}/api/dm/${this.tempDm._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('without a valid dm id', () => {
      it('should return 404 not found', done => {
        request.get(`${url}/api/dm/${invalidID}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });

    describe('without auth headers', () => {
      it('should return 401 auth headers required', done => {
        request.get(`${url}/api/dm/${this.tempDm._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });

  });

  describe('GET: /api/dm/:id/characters', () => {

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

    describe('with a valid dm id', () => {
      it('should return the characters in the campaignMembers array', done => {
        request.get(`${url}/api/dm/${this.tempDm._id}/characters`)
        .set({ Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body[0].characterName).to.equal(this.tempCharacter.characterName);
          expect(res.body[1].characterName).to.equal(this.tempCharacter2.characterName);
          expect(res.body[0]._id).to.equal(this.tempCharacter._id.toString());
          expect(res.body[1]._id).to.equal(this.tempCharacter2._id.toString());
          expect(res.body[0].profileID).to.equal(this.tempCharacter.profileID.toString());
          expect(res.body[1].profileID).to.equal(this.tempCharacter2.profileID.toString());
          done();
        });
      });
    });

  });

  describe('GET /api/mydms/:profileID', () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempDm._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        this.tempProfile.dms.push(this.tempDm._id);
        return Profile.findByIdAndUpdate(this.tempProfile._id, { $set: {dms: this.tempProfile.dms } }, { new: true });
      })
      .then( () => done())
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

    describe('with a valid profile id', () => {
      it('should return a list of dms', done => {
        request.get(`${url}/api/mydms/${this.tempProfile._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('without a valid profile id', () => {
      it('should return a 404 error', done => {
        request.get(`${url}/api/mydms/${invalidID}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });
  });

  describe('without auth headers', () => {
    it('should return 401 auth headers required', done => {
      request.get(`${url}/api/mydms/${this.tempProfile._id}`)
      .end((err, res) => {
        expect(res.status).to.equal(401);
        done();
      });
    });
  });

  describe('GET /api/alldms', () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        this.tempProfile.dms.push(this.tempDm._id);
        return Profile.findByIdAndUpdate(this.tempProfile._id, {$set: { dms: this.tempProfile.dms }}, { new: true } );
      })
      .then( () => done())
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

    describe('with a valid path', () => {
      it('should return a list of every dm for all profiles', done => {
        request.get(`${url}/api/alldms`)
        .set( { Authorization: `Bearer ${this.tempToken}` } )
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('without auth headers', () => {
      it('should return 401 headers required', done => {
        request.get(`${url}/api/alldms`)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });


  });

  describe('PUT /api/dm/:id', () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
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

    const updatedDm = {
      campaignName: 'test campaign name'
    };

    describe('with a valid dm id and body', () => {
      it('should return an updated dm', done => {
        request.put(`${url}/api/dm/${this.tempDm._id.toString()}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(updatedDm)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    describe('without a vaild id', () => {
      it('should return a 404 error', done => {
        request.put(`${url}/api/dm/${invalidID}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(updatedDm)
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });

    describe('without a valid body', () => {
      it('should return a 400 error', done => {
        request.put(`${url}/api/dm/${this.tempDm._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });

    describe('without auth headers', () => {
      it('should return 401 auth header required', done => {
        request.put(`${url}/api/dm/${this.tempDm._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });

  });

  describe('PUT: /api/dm/:id/:characterID', () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        done();
      })
      .catch(done);
    });

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
      this.dmCharPackage = [];
      this.dmCharPackage.push(this.tempCharacter);
      this.dmCharPackage.push(this.tempDm);
      done();
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
        done();
      })
      .catch(done);
    });

    describe('with valid dm and character ids', () => {
      it('should return an updated dm with a filled campaign member', done => {
        request.put(`${url}/api/dm/${this.tempDm._id}/${this.tempCharacter._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .send(this.dmCharPackage)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.campaignMembers).to.include(this.tempCharacter._id.toString());
          done();
        });
      });
    });

  });



  describe('DELETE /api/dm/:id', () => {
    beforeEach( done => {
      exampleDm.profileID = this.tempProfile._id;
      new Dm(exampleDm).save()
      .then( dm => {
        this.tempDm = dm;
        this.tempProfile.dms.push(this.tempDm._id);
        return Profile.findByIdAndUpdate(this.tempProfile._id, { $set: { dms: this.tempProfile.dms } }, { new: true } );
      })
      .then( () => done())
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
      it('should return a 204 status', done => {
        request.delete(`${url}/api/dm/${this.tempDm._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(204);
          Profile.findById(this.tempProfile._id)
          .then( profile => {
            expect(profile.dms.indexOf(this.tempDm._id)).to.equal(-1);
            done();
          })
        .catch(done);
        });
      });
    });

    describe('with an invalid dm id', () => {
      it('should return 404 not found', done => {
        request.delete(`${url}/api/dm/${invalidID}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });

    describe('without auth headers', () => {
      it('should return 401 not found', done => {
        request.delete(`${url}/api/dm/${this.tempDm._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });

  });

});
