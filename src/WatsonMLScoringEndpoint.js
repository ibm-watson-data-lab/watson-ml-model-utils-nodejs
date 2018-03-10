"use strict";

const { WatsonMLModelEndpoint } = require("./WatsonMLModelEndpoint");
let axios = require('axios');
let dotenv = require('dotenv');
dotenv.config();

let TOKEN_MAX_ATTEMPTS = 3;

class WatsonMLScoringEndpoint extends WatsonMLModelEndpoint {

  constructor(fields, options) {
    super(fields, options);
    this.deploymentName = super._getProperty(options, 'deploymentName', 'WML_DEPLOYMENT_NAME');
    this.deploymentId = super._getProperty(options, 'deploymentId', 'WML_DEPLOYMENT_ID');
  }

  score(values) {
    return this.scoreMulti([values])
      .then((response) => {
        return Promise.resolve({prediction: response.predictions[0], data: response.data})
      });
  }

  scoreMulti(valuesArray) {
    this.tokenFailures = 0;
    return this._scoreMulti(valuesArray, 0);
  }

  _scoreMulti(valuesArray, attempt) {
    return super._getWatsonMLAccessToken()
      .then((token) => {
        return axios({
          method: 'POST',
          url: this.scoringUrl,
          data: {
            fields: this.fields,
            values: valuesArray
          },
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
      }).then((response) => {
        let predictions = [];
        let predictionIndex = -1;
        let fields = response.data.fields;
        for (let i = 0; i < fields.length; i++) {
          if (fields[i].toLowerCase() === 'prediction') {
            predictionIndex = i;
            break;
          }
        }
        if (predictionIndex >= 0) {
          let values = response.data.values;
          for (let i = 0; i < valuesArray.length; i++) {
            predictions[i] = values[i][predictionIndex];
          }
          return Promise.resolve({predictions: predictions, data: response.data});
        }
      }).catch((err) => {
        let errorCode = null;
        if (err.response && err.response.data && err.response.data.code && err.response.data.code) {
          errorCode = err.response.data.code;
        }
        if (errorCode && errorCode.indexOf('token') >= 0) {
          if ((attempt+1) >= TOKEN_MAX_ATTEMPTS) {
            console.log('Too many token failures.');
            return Promise.reject(err);
          }
          else {
            console.log('Token failure; attempting to retrieve new token...');
            this.token = null;
            return this._scoreMulti(valuesArray, attempt + 1);
          }
        }
        else {
          return Promise.reject(err);
        }
      });
  }

  _onModelIdSet() {
    if (this.deploymentId) {
      this.scoringUrl = `${this.servicePath}/v3/wml_instances/${this.instanceId}/published_models/${this.modelId}/deployments/${this.deploymentId}/online`
      return Promise.resolve();
    }
    else {
      return this._loadDeployments(this.token, this.modelId)
        .then((deployments) => {
          for (var i=0; i<deployments.length; i++) {
            if (deployments[i].entity.type.toLowerCase() === 'online') {
              if (this.deploymentName) {
                if (deployments[i].entity.name === this.deploymentName) {
                  this.deploymentId = deployments[i].metadata.guid;
                  break;
                }
              }
              else {
                this.deploymentId = deployments[i].metadata.guid;
                break;
              }
            }
          };
          if (! this.deploymentId) {
            let deploymentNameText = this.deploymentName ? `'${this.deploymentName}' ` : '';
            return Promise.reject(new Error(`Unable to find deployment ${deploymentNameText}for model '${this.modelName}'; modelId=${this.modelId}`));
          }
          else {
            this.scoringUrl = `${this.servicePath}/v3/wml_instances/${this.instanceId}/published_models/${this.modelId}/deployments/${this.deploymentId}/online`;
            return Promise.resolve();
          }
        });
      }
  }

  _loadDeployments(token, modelId) {
    let url = `${this.servicePath}/v3/wml_instances/${this.instanceId}/published_models/${modelId}/deployments`    
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

exports.WatsonMLScoringEndpoint = WatsonMLScoringEndpoint;