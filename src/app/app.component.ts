import { Component } from '@angular/core';
import Auth from '@aws-amplify/auth';
import Backend from 'src/aws-exports';
Auth.configure(Backend).authenticationFlowType = 'CUSTOM_AUTH';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'passwordless';
}
