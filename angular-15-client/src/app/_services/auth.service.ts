/* The above class is an Angular service that handles authentication-related functionality such as
login, registration, token refresh, and logout. */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders,HttpRequest } from '@angular/common/http';
import { StorageService } from './storage.service';
import { Observable } from 'rxjs';

const AUTH_API = 'http://localhost:8080/api/auth/';
interface signinRequest { 
  us:String 
  pass:String 
} 
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  signinRequest: any;

  
  
  constructor(private http: HttpClient,private storageService:StorageService) { }

  login(username: String, password: String,): Observable<any> {
   return this.http.post(
      AUTH_API + 'signin',
      {
        username,
        password,
      },
      httpOptions
    );
  }
  updateUser(){
    /*
    this.login(this.signinRequest.us, this.signinRequest.pass).subscribe({
      next: data => {
        console.log(data,"data from login");
        this.storageService.saveUser(data);
      },
      error: err => {
      }
    });*/
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signup',
      {
        username,
        email,
        password
      },
      httpOptions
    );
  }
  refreshToken() {
    return this.http.post(AUTH_API + 'refreshtoken', {}, httpOptions);
  }
  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'update', {}, httpOptions); //THIS IS A LOGOUT ROUTE SOMEHOW TOO 
  }
}
