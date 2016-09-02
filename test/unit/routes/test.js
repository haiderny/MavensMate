'use strict';

var request         = require('supertest');
var sinon           = require('sinon');
var helper          = require('../../test-helper');
var logger          = require('winston');
var localServer     = require('../../../app');

describe('app/test', function(){

  var sandbox;
  var server;
  var app;
  var project;
  var commandExecutorStub;

  beforeEach(function(done) {
    sandbox = sinon.sandbox.create();
    localServer.start()
      .then(function(serverStartResult) {
        app = serverStartResult.app;
        server = serverStartResult.server;
        commandExecutorStub = sandbox.stub(app.get('commandExecutor'), 'execute');
        commandExecutorStub.resolves({ success: true });
        helper.stubSalesforceClient(sandbox);
        helper.bootstrapEnvironment();
        helper.putTestProjectInTestWorkspace('test-route-test');
        return helper.addProject('test-route-test');
      })
      .then(function(proj) {
        project = proj;
        done();
      })
      .catch(function(err) {
        logger.error(err);
        done(err);
      });
  });

  afterEach(function(done) {
    sandbox.restore();
    helper.cleanUpProject('test-route-test');
    server.close(done);
  });

  describe('/app/test/new', function() {
    it('should render unit_test/index.html', function(done) {
      request(app)
        .get('/app/test/new')
        .query({ pid: project.settings.id })
        .expect('Content-Type', /html/)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
  });

  describe('/app/test/coverage', function() {
    it('should render unit_test/index.html', function(done) {
      request(app)
        .post('/app/test/coverage')
        .field('apexClassOrTriggerName', 'foo')
        .field('type', 'bar')
        .field('type', 'bat')
        .query({ pid: project.settings.id })
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
  });

  describe('/app/test', function() {
    it('should add request to the store and return an id', function(done) {
      request(app)
        .post('/app/test')
        .field('foo', 'bar')
        .query({ pid: project.settings.id })
        .expect('Content-Type', /json/)
        .expect(function(res) {
          res.body.id = 'test-id';
        })
        .expect(200, {
          id: 'test-id',
          status: 'pending'
        })
        .end(function(err, res) {
          commandExecutorStub.calledOnce.should.equal(true);
          if (err) throw err;
          done();
        });
    });
  });

});


