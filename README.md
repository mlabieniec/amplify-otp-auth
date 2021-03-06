# Passwordless OTP Authentication with SMS

A sample application that utilizes AWS Amplify, Cognito, and "CUSTOM_AUTH" flow for One-Time-Password (OTP) functionality via Amazon SNS. This app requires:

 - AWS Account
 - AWS Amplify CLI
 - Angular 9+
 - Node.js 10+

 ```bash
 git clone git@github.com:mlabieniec/amplify-otp-auth
 cd amplify-otp-auth
 npm i
 amplify init
 ```

The app (specifically the auth.component) will deal with a `CUSTOM_AUTH` flow with AWS Amplify and Amazon Cognito. There are several Lambda Functions that handle the actual OTP logic found in the `amplify/backed/function` folder after completion:

 - xxxCreateAuthChallenge
 - xxxDefineAuthChallenge
 - xxxPreSignup
 - xxxVerifyAuthChallengeResponse

The "xxx" prefix is dependent on what the Amplify project resource (category) was named when setup with the Amplify CLI.

> NOTE: There is an additional IAM policy Statement that is added to the CreateAuthChallenge function (found in the src folder) due to the need to talk to Amazon SNS:

```json
{
    "Sid": "VisualEditor1",
    "Effect": "Allow",
    "Action": "sns:Publish",
    "Resource": "*"
}
```
 
This should be added to the `xxxCreateAuthChallenge-cloudformation-template.json`'s (found in the amplify/backend/function directory after `amplify push`) `Lambdaexecutionpolicy.Properties.PolicyDocument.Statement` array.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
