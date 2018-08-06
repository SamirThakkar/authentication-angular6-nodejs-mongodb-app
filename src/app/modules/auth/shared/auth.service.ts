import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { tokenNotExpired } from 'angular2-jwt';
import {map} from 'rxjs/operators';
import {apiUrl} from '../../../shared/constant';

@Injectable()
export class AuthService {
    http: any;
    authToken:any;
    user:any;
    options;


    static get parameters() {
        return [Http];
    }

    constructor(http) {
        this.http = http;
    }

    // Function to create headers, add token, to be used in HTTP requests
    createAuthenticationHeaders() {
        this.loadToken();
        // Headers configuration options
        this.options = new RequestOptions({
            headers: new Headers({
                'Content-Type': 'application/json',
                'authorization': this.authToken
            })
        });
    }
    loadToken() {
        this.authToken = localStorage.getItem('token'); // Get token and asssign to variable to be used elsewhere
    }

    registerUser(userObj) {
        let searchUrl = `${apiUrl}/register`;
        return this.http.post(searchUrl, userObj).pipe(map((response: any) => response.json()));
    }

    login(user) {
        let searchUrl = `${apiUrl}/login`;
        return this.http.post(searchUrl, user).pipe(map((response: any) => response.json()));
    }

    // Function to store user's data in client local storage
    storeUserData(token, user) {
        localStorage.setItem('token', token); // Set token in local storage
        localStorage.setItem('user', JSON.stringify(user)); // Set user in local storage as string
        this.authToken = token; // Assign token to be used elsewhere
        this.user = user; // Set user to be used elsewhere
    }

    // Function to check if user is logged in
    loggedIn() {
        return tokenNotExpired();
    }

    logout() {
        this.authToken = null; // Set token to null
        this.user = null; // Set user to null
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // Clear local storage
    }
}
