"use strict";

let axios = require('axios');
let dotenv = require('dotenv');
dotenv.config();

let TOKEN_MAX_ATTEMPTS = 3;

class WatsonMLModelEndpoint {

  constructor(fields, options, requireDeployment) {
    if (! fields) {
      throw 'fields not specified.';
    }
    if (! options) {
      options = {};
    }
    // attempt to load Watson ML credentials from VCAP_SERVICES
    if (process.env.VCAP_SERVICES) {
      let vcapServices = JSON.parse(process.env.VCAP_SERVICES);
      if (vcapServices['pm-20'] && vcapServices['pm-20'].length > 0) {
        let service = vcapServices['pm-20'][0];
        if (service.credentials) {
          options['servicePath'] = service.url;
          options['username'] = service.username;
          options['password'] = service.password;
          options['instanceId'] = service.instance_id;
        }
      }
    }
    this.fields = fields;
    this.servicePath = this._getRequiredProperty(options, 'servicePath', 'WML_SERVICE_PATH', 'https://ibm-watson-ml.mybluemix.net');
    this.username = this._getRequiredProperty(options, 'username', 'WML_USERNAME');
    this.password = this._getRequiredProperty(options, 'password', 'WML_PASSWORD');
    this.instanceId = this._getRequiredProperty(options, 'instanceId', 'WML_INSTANCE_ID');
    this.modelName = this._getProperty(options, 'modelName', 'WML_MODEL_NAME');
    if (! this.modelName) {
      this.modelId = this._getRequiredProperty(options, 'modelId', 'WML_MODEL_ID');
      process.nextTick(() => this._onModelIdSet());
    }
  }

  _getProperty(options, optionsName, envName, defaultValue) {
    let prop = (options && options[optionsName]) || process.env[envName] || defaultValue;
    return prop;
  }

  _getRequiredProperty(options, optionsName, envName, defaultValue) {
    let prop = this._getProperty(options, optionsName, envName, defaultValue);
    if (! prop) {
      throw `${optionsName} not specified.`;
    }
    return prop;
  }

  _getWatsonMLAccessToken() {
    if (this.token) {
      return Promise.resolve(this.token);
    }
    else {
      return axios({
        method: 'GET',
        url: `${this.servicePath}/v3/identity/token`,
        headers: {
          'Authorization': 'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
        }
      })
        .then((response) => {
          this.token = 'Bearer ' + response.data.token;
          if (! this.modelId) {
            return this._loadModelDetailsFromName()
              .then(() => {
                return Promise.resolve(this.token);
              });
          }
          else {
            return Promise.resolve(this.token);
          }
        });
    }
  }

  _loadModelDetailsFromName() {
    return this._loadModels(this.token)
      .then((models) => {
        for (var i=0; i<models.length; i++) {
          if (models[i].entity.name === this.modelName) {
            this.modelId = models[i].metadata.guid;
            break;
          }
        };
        if (! this.modelId) {
          return Promise.reject(new Error(`Unable to find model '${this.modelName}'`));
        }
        else {
          return this._onModelIdSet();
        }
      });
  }

  // override in subclass if need to do anythin when the model ID is set
  _onModelIdSet() {
    return Promise.resolve();
  }

  _loadModels(token) {
    let url = `${this.servicePath}/v3/wml_instances/${this.instanceId}/published_models`    
    return axios({
      method: 'GET',
      url: url,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      return Promise.resolve(response.data.resources)
    });
  }
}

exports.WatsonMLModelEndpoint = WatsonMLModelEndpoint;