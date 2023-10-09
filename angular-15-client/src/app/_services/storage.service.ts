/* The StorageService class provides methods for saving, updating, and retrieving user data from
session storage in an Angular application. */
import { Injectable } from '@angular/core';


const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() {}

  clean(): void {
    window.sessionStorage.clear();
  }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    console.log(user);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  public updateUserBalance(){
  }
/**
 * The function `updateUser` updates the `depositedBalance` and `forwarderAddr` properties of a user
 * object, stores the updated user object in the session storage, and logs the updated user object.
 * @param {string} forwarderAddr - The forwarder address is the address of the user's forwarder, which
 * is responsible for forwarding transactions on behalf of the user.
 * @param {string} depositedBalance - The deposited balance of the user, represented as a string.
 */
  public updateUser(forwarderAddr:string,depositedBalance:string):any{
    const user=this.getUser();
    user.depositedBalance=depositedBalance;
    user.forwarderAddr=forwarderAddr
    console.log(user);
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log(this.getUser()); /* make it look better figure out _id*/
   // window.location.reload();

  }
/**
 * The function retrieves the user object from the session storage and returns it as a parsed JSON
 * object.
 * @returns an object.
 */
  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      console.log(user);
      return JSON.parse(user);
    }

    return {};
  }

/**
 * The function checks if a user is logged in by checking if a user key exists in the session storage.
 * @returns The isLoggedIn() function returns a boolean value. It returns true if there is a user
 * stored in the session storage, and false if there is no user stored.
 */
  public isLoggedIn(): boolean {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return true;
    }

    return false;
  }
}
