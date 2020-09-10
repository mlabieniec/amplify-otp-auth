import { Component, OnInit } from '@angular/core';
import Auth from '@aws-amplify/auth';

/**
 * This component will deal with a CUSTOM_AUTH flow with AWS Amplify and Amazon Cognito.
 * There are several Lambda Functions that handle the actual OTP logic found in the `amplify/backed/function`
 * folder:
 *  - xxxCreateAuthChallenge
 *  - xxxDefineAuthChallenge
 *  - xxxPreSignup
 *  - xxxVerifyAuthChallengeResponse
 * 
 * The "xxx" prefix is dependent on what the Amplify project resource (category) was named
 * when setup with the Amplify CLI.
 * 
 * NOTE: There is an additional IAM policy Statement that is added to the CreateAuthChallenge 
 * function (found in the src folder) due to the need to talk to Amazon SNS:
 * 
 * ```
 *   {
 *     "Sid": "VisualEditor1",
 *     "Effect": "Allow",
 *     "Action": "sns:Publish",
 *     "Resource": "*"
 *   }
 * ```
 * 
 * This should be added to the xxxCreateAuthChallenge-cloudformation-template.json's 
 * `Lambdaexecutionpolicy.Properties.PolicyDocument.Statement` array.
 */
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  // This is the phone number as entered on the page
  phone: string;
  // The OTP code that is sent via Lambda Trigger
  code: string;
  // The returned session object that is sent back to confirm the answer (via Lambda Trigger)
  session: any;
  // The CognitoUser object
  user: any;
  // A simple message that's displayed on the page
  message: string;
  // If we are in the state of waiting for an OTP code
  waiting = false;

  constructor() { }

  /**
   * On intitialization check for a logged in session
   * Amplify stores the session to persist login by default
   * with localstorage. This can be changed to a custom storage
   * engine via Amplify.configure (in app.component).
   */
  ngOnInit(): void {
    Auth.currentAuthenticatedUser()
      .then((user) => {
        this.user = user;
        this.setMessage(`Hello ${user.username}`);
        this.session = null;
        this.waiting = false;
      })
      .catch((err) => {
        console.error(err);
        this.setMessage("Not Signed In");
        this.waiting = false;
      });
  }

  /**
   * On Submission of the phone number form, run Auth.signIn with
   * the phone number (and no password). If success, user is already present
   * otherwise, run signUp, or re-run signIn if we get a UsernameExistsException
   * @param event SubmitEvent
   */
  async onAuthSubmit(event) {
    event.preventDefault();
    this.signIn();
  }

  /**
   * Basic Amplify signUp, for passwordless/OTP we need to
   * send a plain string as a "dummy" password. The Lambda function
   * triggers handle the actual OTP setup (see amplify/functions)
   */
  async signUp() {
    await Auth.signUp({
      username: this.phone,
      password: "passwordless",
      attributes: {
        phone_number: this.phone,
      },
    }).then(() => this.signIn());
  }

  /**
   * Signin to Cognito with only a phone number. The logic for CUSTOM_AUTH
   * is handled on the backend via Lambda functions (amplify/backend).
   */
  async signIn() {
    Auth.signIn(this.phone)
      .then((result) => {
        this.session = result;
        this.setMessage("Waiting for Code");
        this.waiting = true;
      })
      .catch((e) => {
        if (e.code === 'UserNotFoundException') {
          this.signUp();
        } else if (e.code === 'UsernameExistsException') {
          this.setMessage("Waiting for Code");
          this.waiting = true;
        } else {
          console.log(e.code);
          console.error(e);
          this.waiting = false;
        }
      });
  }

  /**
   * Sign out of cognito, which will clear local data, session
   * and reset local variables
   */
  async signOut() {
    if (this.user) {
      await Auth.signOut();
      this.user = null;
      this.code = "";
      this.waiting = false;
      this.setMessage("Signed Out");
    } else {
      this.setMessage("Not Signed In");
      this.waiting = false;
    }
  }

  /**
   * Set a simple message to be displayed on the page
   * @param msg string
   */
  setMessage(msg: string) {
    this.message = msg;
  }

  /**
   * Verify the OTP that was sent via SMS to the user.
   * The code will  be dispatched via the Lamba trigger/SNS.
   * The session is the object returned from signIn, if succesful
   * the user will be logged in, otherwise we clear out the data and
   * display the message i.e. `invalid code`
   * @param event SubmitEvent
   */
  verifyOtp(event) {
    event.preventDefault();
    Auth.sendCustomChallengeAnswer(this.session, this.code)
      .then((user) => {
        this.setMessage(`Hello ${user.username}`);
        this.user = user;
        this.session = null;
        this.waiting = false;
      })
      .catch((err) => {
        this.setMessage(err.message);
        this.code = "";
        this.waiting = false;
        console.log(err);
      });
  }

}
