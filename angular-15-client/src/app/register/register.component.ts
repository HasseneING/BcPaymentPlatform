/* The RegisterComponent class is responsible for handling user registration functionality in an
Angular application. */
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form: any = {
    username: null,
    email: null,
    password: null,
    forwarderAddr:"0x0",
    depositedBalance: "0",
  };
 
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }
/**
 * The onSubmit function handles the form submission for user registration, calling the register method
 * of the authService and handling the success and error cases.
 */
  onSubmit(): void {
    const { username, email, password} = this.form;

    this.authService.register(username, email, password).subscribe({
      next: data => {
        console.log(data);
        this.isSuccessful = true;
        this.isSignUpFailed = false;
        this.reloadPage();
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isSignUpFailed = true;
      }
    });
  }
  
  reloadPage(): void {
    window.location.reload();
  }
}
