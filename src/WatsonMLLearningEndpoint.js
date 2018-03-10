"use strict";

const { WatsonMLModelEndpoint } = require("./WatsonMLModelEndpoint");
let axios = require('axios');
let dotenv = require('dotenv');
dotenv.config();

let TOKEN_MAX_ATTEMPTS = 3;

class WatsonMLLearningEndpoint extends WatsonMLModelEndpoint {

  constructor(fields, options) {
    super(fields, options);
  }

  _onModelIdSet() {
    this.feedbackUrl = `${this.servicePath}/v3/wml_instances/${this.instanceId}/published_models/${this.modelId}/feedback`
    this.iterationUrl = `${this.servicePath}/v3/wml_instances/${this.instanceId}/published_models/${this.modelId}/learning_iterations`
    return Promise.resolve();
  }

  startFeedbackEvaluation(values) {
    this.tokenFailures = 0;
    return this._startFeedbackEvaluation(0);
  }

  submitFeedback(values) {
    return this.submitFeedbackMulti([values])
      .then((response) => {
        return Promise.resolve({data: response.data})
      });
  }

  submitFeedbackMulti(valuesArray) {
    this.tokenFailures = 0;
    return this._submitFeedbackMulti(valuesArray, 0);
  }

  _submitFeedbackMulti(valuesArray, attempt) {
    return super._getWatsonMLAccessToken()
      .then((token) => {
        return axios({
          method: 'POST',
          url: this.feedbackUrl,
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
        return Promise.resolve({data: response.data});
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

  _startFeedbackEvaluation(attempt) {
    return super._getWatsonMLAccessToken()
      .then((token) => {
        return axios({
          method: 'POST',
          url: this.iterationUrl,
          data: {},
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });
      }).then((response) => {
        return Promise.resolve({data: response.data});
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
            return this._startFeedbackEvaluation(attempt + 1);
          }
        }
        else {
          return Promise.reject(err);
        }
      });
  }
}

exports.WatsonMLLearningEndpoint = WatsonMLLearningEndpoint;