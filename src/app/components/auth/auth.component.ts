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

  async onAuthSubmit(event) {
    event.preventDefault();
    Auth.signIn(this.phone)
      .then((result) => {
        console.log(result);
        this.setMessage("Waiting for Code...")
        this.waiting = true;
        this.session = result;
      })
      .catch((e) => {
        if (e.code === 'UserNotFoundException') {
          this.signUp();
        } else if (e.code === 'UsernameExistsException') {
          this.signIn();
        } else {
          console.log(e.code);
        }
      });
  }

  async signUp() {
    await Auth.signUp({
      username: this.phone,
      password: "passwordless",
      attributes: {
        phone_number: this.phone,
      },
    }).then(() => this.signIn());
  }

  async signIn() {
    this.setMessage("Verify Number");
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
          this.signIn();
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
        this.setMessage("Logged in");
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
