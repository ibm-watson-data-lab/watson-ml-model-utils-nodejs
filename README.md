# Watson Machine Learning Model Utils

Note: This is a work in progress. Use exact versions when installing (e.g. --save-exact) as backwards-incompatible changes may be introduced.

## Overview

This is a simple Node.js wrapper for calling scoring endpoints, providing feedback, and starting feedback evaluation on deployed models in the Watson Machine Learning service.

## Installation

This package can be installed via npm:
`npm install watson-ml-model-utils`

## Usage - Scoring

After setting up your environment (see below) you can make machine learning predictions with just a few lines of code. First, include the `WatsonMLScoringEndpoint` class from the `watson-ml-model-utils` module:

```javascript
const { WatsonMLScoringEndpoint } = require("watson-ml-model-utils");
```

Create an instance of the `WatsonMLScoringEndpoint` with the features you used to train your model:

```javascript
const features = ['SquareFeet', 'Bedrooms'];
const endpoint = new WatsonMLScoringEndpoint(features);
```

Make a prediction by calling `score` with the values you would like to use for your prediction:

```javascript
const values = [2400, 4];
endpoint.score(values)
  .then(response => console.log(response.prediction))
  .catch(err => console.log(err));
```

You can make multiple predictions in a single call to the scoring endpoint by calling `scoreMulti`:

```javascript
const values = [[2400, 4], [2000, 3], [2600, 6]];
endpoint.scoreMulti(values)
  .then(response => console.log(response.predictions))
  .catch(err => console.log(err));
```

You can also access the full response from Watson ML in the `data` property of the response:

```javascript
endpoint.score(values)
  .then(response => console.log(response.data))
```

The `WatsonMLScoringEndpoint` will look in your environment for the appropriate Watson ML credentials, Model ID, and Deployment ID.
Alternatively, you can pass in the Model ID and Deployment IDs. This would be valuable if you plan on testing or working with multiple models, or multiple versions of the same model.

```javascript
let endpoint = new WatsonMLScoringEndpoint(features, {
  modelId: 'xxx',
  deploymentId: 'xxx'
});
```

You can also pass in your Watson ML service credentials (or you can selectively choose what options you want to pass in -- all others will be read from the environment):

```javascript
let endpoint = new WatsonMLScoringEndpoint(features, {
  servicePath: 'https://ibm-watson-ml.mybluemix.net',
  username: 'xxx',
  password: 'xxx',
  instanceId: 'xxx',
  modelId: 'xxx',
  deploymentId: 'xxx'
});
```

You can pass in a Model Name and, optionally, a Deployment Name in place of Model ID and Deployment ID. The utility will query your Watson ML service for the first model that matches the name and the first deployment (that matches the deployment name if speficied):

```javascript
let endpoint = new WatsonMLScoringEndpoint(features, {
  servicePath: 'https://ibm-watson-ml.mybluemix.net',
  modelName: 'House Prices Model'
});
```

```javascript
let endpoint = new WatsonMLScoringEndpoint(features, {
  servicePath: 'https://ibm-watson-ml.mybluemix.net',
  modelName: 'House Prices Model',
  deploymentName: 'House Prices Deployment'
});
```

## Usage - Continuous Learning

First, include the `WatsonMLLearningEndpoint` class from the `watson-ml-model-utils` module:

```javascript
const { WatsonMLLearningEndpoint } = require("watson-ml-model-utils");
```

Create an instance of the `WatsonMLLearningEndpoint` with all the columns in your training data table (be sure to include all the columns and not just the features you used to train your model):

```javascript
const fields = ['SquareFeet', 'Bedrooms', 'Color'];
const endpoint = new WatsonMLLearningEndpoint(fields);
```

### Submit Feedback

Submit new feedback by calling `submitFeedback` with the values for the corresponding fields that you would like to submit:

```javascript
const values = [2400, 4, 'Blue'];
endpoint.submitFeedback(values)
  .then(response => console.log(response))
  .catch(err => console.log(err));
```

You can submit multiple feedback entries in a single call to the learning endpoint by calling `submitFeedbackMulti`:

```javascript
const values = [[2400, 4, 'Blue'], [2000, 3, 'White'], [2600, 6, 'Blue']];
endpoint.submitFeedbackMulti(values)
  .then(response => console.log(response))
  .catch(err => console.log(err));
```

You can access the full response from Watson ML in the `data` property of the response:

```javascript
endpoint.score(values)
  .then(response => console.log(response.data))
```

The `WatsonMLLearningEndpoint` will look in your environment for the appropriate Watson ML credentials and Model ID. Alternatively, you can pass in the Model ID. This would be valuable if you plan on testing or working with multiple models, or multiple versions of the same model.

```javascript
let endpoint = new WatsonMLLearningEndpoint(fields, {
  modelId: 'xxx'
});
```

You can also pass in your Watson ML service credentials (or you can selectively choose what options you want to pass in -- all others will be read from the environment):

```javascript
let endpoint = new WatsonMLLearningEndpoint(features, {
  servicePath: 'https://ibm-watson-ml.mybluemix.net',
  username: 'xxx',
  password: 'xxx',
  instanceId: 'xxx',
  modelId: 'xxx'
});
```

You can pass in a Model Name in place of Model ID. The utility will query your Watson ML service for the first model that matches the name and the first deployment (that matches the deployment name if speficied):

```javascript
let endpoint = new WatsonMLScoringEndpoint(features, {
  servicePath: 'https://ibm-watson-ml.mybluemix.net',
  modelName: 'House Prices Model'
});
```

### Start Feedback Evaluation

You can kick off a new evaulation by calling `startFeedbackEvaluation`:

```javascript
endpoint.startFeedbackEvaluation()
  .then(response => console.log(response))
  .catch(err => console.log(err));
```

## Environment Setup

### Local Environment

Create a `.env` file in the root of your project and add the following:

```
WML_SERVICE_PATH=https://ibm-watson-ml.mybluemix.net
WML_USERNAME=
WML_PASSWORD=
WML_INSTANCE_ID=
WML_MODEL_ID=
WML_DEPLOYMENT_ID=
```

2. Fill in `WML_USERNAME`, `WML_PASSWORD`, and `WML_INSTANCE_ID`:
  - Go to your IBM Watson Machine Learning service in your IBM Cloud instance
  - Click _Service Credentials_
  - Expand your credentials
  - Copy and paste the username, password, and instance_id values

![Watson ML Service Credentials](https://raw.githubusercontent.com/ibm-watson-data-lab/watson-ml-model-utils-nodejs/master/readme/img/watson-ml-credentials.png)

3. Fill in `WML_MODEL_ID` and `WML_DEPLOYMENT_ID` (required for scoring only, not continuous learning):
  - Click your model under _Models_ in the _Assets_ tab in your Data Science Platform or Watson Data Platform account
  - Click the _Deployments_ tab
  - Click the deployment
  - Copy and paste the Deployment ID and Model ID values

![Watson ML Model Deployment](https://raw.githubusercontent.com/ibm-watson-data-lab/watson-ml-model-utils-nodejs/master/readme/img/watson-ml-model-deployment.png)

### IBM Cloud Environment

1. Create or modify your `manifest.yml` file. Here is a sample:

```
applications:
- path: .
  buildpack: sdk-for-util-nodejs
  no-route: false
  memory: 128M
  instances: 1
  domain: mybluemix.net
  name: watson-ml-scoring-demo
  host: watson-ml-scoring-demo-${random-word}
disk_quota: 256M
services:
 - IBM Watson Machine Learning
env:
  WML_MODEL_ID: xxx
  WML_DEPLOYMENT_ID: xxx
```

2. Specify the name of your Watson Machine Learning Service
  - Replace `IBM Watson Machine Learning` under *services:* with the name of the Watson Machine Learning service provisioned in your account

3. Fill in `WML_MODEL_ID` and `WML_DEPLOYMENT_ID` (required for scoring only, not continuous learning):
  - Click your model under _Models_ in the _Assets_ tab in your Data Science Platform or Watson Data Platform account
  - Click the _Deployments_ tab
  - Click the deployment
  - Copy and paste the Deployment ID and Model ID values

![Watson ML Model Deployment](https://raw.githubusercontent.com/ibm-watson-data-lab/watson-ml-model-utils-nodejs/master/readme/img/watson-ml-model-deployment.png)