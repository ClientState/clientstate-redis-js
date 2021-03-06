var MockXMLHttpRequest, fake_provider_data,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

fake_provider_data = {
  access_token: "fake-access-token"
};

beforeEach(function() {
  return window.OAuth = (function() {
    var MockOAuth;
    MockOAuth = (function() {
      function MockOAuth() {}

      MockOAuth.calledCounts = {
        initialize: 0,
        setOAuthdURL: 0,
        popup: 0
      };

      MockOAuth.calledWith = {
        initialize: [],
        setOAuthdURL: [],
        popup: []
      };

      MockOAuth.initialize = function(clientid) {
        this.calledCounts.initialize += 1;
        return this.calledWith.initialize.push(arguments);
      };

      MockOAuth.setOAuthdURL = function(address) {
        return this.calledCounts.setOAuthdURL += 1;
      };

      MockOAuth.popup = function(provider, cb) {
        this.calledCounts.popup += 1;
        this.calledWith.popup.push(arguments);
        if (this.err == null) {
          return cb(null, fake_provider_data);
        } else {
          return cb({
            stack: 'this is an error stack'
          });
        }
      };

      return MockOAuth;

    })();
    return MockOAuth;
  })();
});

MockXMLHttpRequest = (function() {
  function MockXMLHttpRequest() {
    this.send = __bind(this.send, this);
    this.open = __bind(this.open, this);
  }

  MockXMLHttpRequest.prototype.headers = {};

  MockXMLHttpRequest.prototype.setRequestHeader = function(key, value) {
    return this.headers[key] = value;
  };

  MockXMLHttpRequest.prototype.open = function(method, url, bool) {
    this.responseText = "JSON DATA";
    this.method = method;
    return this.url = url;
  };

  MockXMLHttpRequest.prototype.send = function(value) {
    this.value = value;
    return this.onload();
  };

  return MockXMLHttpRequest;

})();

window.XMLHttpRequest = MockXMLHttpRequest;

describe('Call ClientStateRedis.auth_popup', function() {
  it('calls OAuth appropriately', function(done) {
    var csr;
    csr = new ClientState("uuid", "localhost:4444");
    return csr.auth_popup("github", "github-client-id", function(err, provider_data) {
      chai.assert.equal(provider_data.access_token, "fake-access-token");
      chai.assert.equal(OAuth.calledCounts.initialize, 1);
      return done();
    });
  });
  it('handles no callback case', function(done) {
    var csr;
    chai.assert.equal(OAuth.calledCounts.initialize, 0);
    csr = new ClientState("uuid", "localhost:4444");
    csr.auth_popup("github", "github-client-id");
    return done();
  });
  it('handles error from popup', function(done) {
    var csr;
    OAuth.err = true;
    csr = new ClientState("uuid", "localhost:4444");
    return csr.auth_popup("github", "clientid", function(err, provider_data) {
      chai.assert.equal(err.stack, "this is an error stack");
      return done();
    });
  });
  return it('call to github_auth_popup is works', function(done) {
    var cs;
    cs = new ClientState("GITHUB_CID");
    return cs.github_auth_popup(function(err, provider_data) {
      return cs.get("GET", "foobar", function(err, req) {
        chai.assert.equal(req.url, 'https://GITHUB_CID.clientstate.io/GET/foobar');
        return done();
      });
    });
  });
});

describe('ClientStateRedis.get method', function() {
  it('calls JSONP with correct url and gets back data with 3 arguments', function(done) {
    var csr;
    csr = new ClientState("uuid", "localhost:4444");
    return csr.auth_popup("github", "client-id", function(err, provider_data) {
      return csr.get("GET", "foobar", function(err, req) {
        chai.assert.equal(req.responseText, "JSON DATA");
        chai.assert.equal(req.url, 'https://uuid.localhost:4444/GET/foobar');
        return done();
      });
    });
  });
  return it('calls opens request with correct url with lrange and args', function(done) {
    var csr;
    csr = new ClientState("uuid", "localhost:4444");
    return csr.auth_popup("github", "client-id", function(err, provider_data) {
      return csr.get("lrange", "foobar", [0, 1], function(err, req) {
        chai.assert.equal(req.url, 'https://uuid.localhost:4444/lrange/foobar?args=0,1');
        return done();
      });
    });
  });
});

describe('ClientStateRedis.post method', function() {
  it('opens request and makes callback with 4 arguments', function(done) {
    var csr;
    csr = new ClientState("uuid", "localhost:4444");
    return csr.auth_popup("github", "client-id", function(err, provider_data) {
      return csr.post("command", "key", "value", function(err, req) {
        chai.assert.equal(req.url, 'https://uuid.localhost:4444/command/key');
        return done();
      });
    });
  });
  return it('opens request and makes callback with 5 arguments', function(done) {
    var csr;
    csr = new ClientState("uuid", "localhost:4444");
    return csr.auth_popup("github", "client-id", function(err, provider_data) {
      return csr.post("command", "key", "value", ["arg1", "arg2"], function(err, req) {
        chai.assert.equal(req.url, 'https://uuid.localhost:4444/command/key?args=arg1,arg2');
        return done();
      });
    });
  });
});
