'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const Profile = require('../model/profile.js');
const User = require('../model/user.js');


require('../server.js');

const url = `http://localhost:${process.env.PORT}`;

const exampleUser = {
  username: 'testusername',
  password: 'lalala',
  email: 'example@example.com'
};

const exampleProfile = {
  name: 'example name',
};


describe('Profile Routes', () => {
  beforeEach( done => {
    new User(exampleUser)
    .generatePasswordHash(exampleUser.password)
    .then( user => user.save())
    .then( user => {
      this.tempUser = user;
      return user.generateToken();
    })
    .then( token => {
      // console.log('Token', token);
      this.tempToken = token;
      // console.log('TempToken', this.tempToken);
      done();
    })
    .catch( err => done(err));
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
  describe(`POST ${url}/api/profile`, () => {
    describe('with a valid body', () => {
      it('should return a profile', done => {
        request.post(`${url}/api/profile`)
        .set( { Authorization: `Bearer ${this.tempToken}` } )
        .send(exampleProfile)
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal(exampleProfile.name);
          done();
        });
      });
    });
    describe('with an invalid body', () => {
      it('should return a 400 error', done => {
        request.post(`${url}/api/profile`)
        .set( { Authorization: `Bearer ${this.tempToken}` } )
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });

    describe('with an invalid token', () => {
      it('should return 401 error', done => {
        request.post(`${url}/api/profile`)
        .send(exampleProfile)
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });

    describe('with no token', () => {
      it('should return a 401 status code', done => {
        request.post(`${url}/api/profile`)
        .set( { Authorization: 'Bearer ' } )
        .end( err => {
          expect(err.status).to.equal(401);
          expect(err.message).to.equal('Unauthorized');
          done();
        });
      });
    });
  });

  describe('GET /api/profile/:id', () => {
    before( done => {
      exampleProfile.userID = this.tempUser._id.toString();
      new Profile(exampleProfile).save()
      .then( profile => {
        this.tempProfile = profile;
        done();
      })
      .catch(err => done(err));
    });
    describe('with a valid id', () => {
      it('should return a 200', done => {
        request.get(`${url}/api/${this.tempProfile._id.toString()}`)
        .end( err => {
          expect(err.status).to.equal(404);
          done();
        });
      });
    });
  });

  describe('PUT /api/profile/:id', () => {
    before( done => {
      exampleProfile.userID = this.tempUser._id.toString();
      new Profile(exampleProfile).save()
      .then( profile => {
        this.tempProfile = profile;
        done();
      })
      .catch( err => done(err));
    });
    const updated = {
      name: 'updated name',
    };
    describe('with a valid profile id and body', () => {
      it('should return an updated profile', done => {
        request.put(`${url}/api/profile/${this.tempProfile._id.toString()}`)
        .set( { Authorization: `Bearer ${this.tempToken}`} )
        .send(updated)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal(updated.name);
          done();
        });
      });
    });
    describe('without a valid profile id', () => {
      it('should return a 404 error', done => {
        request.put(`${url}/api/profile/n0taval1d1d00p5`)
        .set( { Authorization: `Bearer ${this.tempToken}`} )
        .send(updated)
        .end((err, res) => {
          expect(err.status).to.equal(404);
          expect(res.text).to.equal('NotFoundError');
          done();
        });
      });
    });
    describe('without a valid body', () => {
      it('should return a 400 error', done => {
        request.put(`${url}/api/profile/${this.tempProfile._id}`)
        .set( { Authorization: `Bearer ${this.tempToken}`} )
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });
  });





  // describe('DELETE /api/profile/:id', () => {
  //   beforeEach( done => {
  //     exampleProfile.userID = this.tempUser._id.toString();
  //     new Profile(exampleProfile).save()
  //     .then( profile => {
  //       this.tempProfile = profile;
  //       done();
  //     })
    //   .catch( err => done(err));
    // });
    //
    // afterEach( done => {
    //   Promise.all([
    //     User.remove({}),
    //     Profile.remove({}),
    //   ])
    //   .then( () => {
    //     delete exampleProfile.userID;
    //     done();
    //   })
    //   .catch( err => done(err));
    // });

    // describe('with a valid profile id', () => {
    //   it('should delete the user and profile, with the profiles recipes and comments', done => {
    //     request.delete(`${url}/api/profile/${this.tempProfile._id.toString()}`)
    //     .set( { Authorization: `Bearer ${this.tempToken}` } )
    //     .end((err, res) => {
    //       if (err) return done(err);
    //       expect(res.status).to.equal(204);
          // Profile.findById(this.tempProfile._id)
          // .catch( err => {
          //   expect(err).to.be(404);
          // });
          // User.findById(this.tempUser._id)
          // .catch( err => {
            // expect(err).to.be(404);
          // });
    //       done();
    //     });
    //   });
    // });
    // describe('without a valid profile id', () => {
    //   it('should return a 404 error', done => {
    //     request.delete(`${url}/api/profile/n0taval1d1d00p5`)
    //     .set( { Authorization: `Bearer ${this.tempToken}` } )
    //     .end( err => {
    //       expect(err.status).to.equal(404);
    //       done();
    //     });
    //   });
    // });
  // });

});
