import { Component, OnInit } from '@angular/core';
import Auth from '@aws-amplify/auth';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  phone: string;
  code: string;
  session: any;
  user: any;
  message: string;
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

  setMessage(msg: string) {
    console.log(msg);
    this.message = msg;
  }

  verifyOtp(event) {
    event.preventDefault();
    console.log(this.session);
    console.log(this.code);
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
        console.log(err);
        this.waiting = false;
      });
  }

  setUser(user: any) {
    console.log('logged in user: ', user);
  }

}
