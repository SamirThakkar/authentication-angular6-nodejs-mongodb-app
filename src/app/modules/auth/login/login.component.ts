import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Http} from '@angular/http';
import {AuthService} from '../shared/auth.service';
declare const $;


@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    EMAIL_REGEX = '^[a-zA-Z0-9_]([a-zA-Z0-9._+-]|)*@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$';
    Email: any;
    Password: any;
    successMessage:any;
    isSuccessMessage:boolean = false;
    isErrorMessage :boolean = false;
    errorMessage:any;
    rememberMe:any;

    constructor(private router: Router, private http: Http, private route: ActivatedRoute ,private authService: AuthService) {
    }

    ngOnInit() {
        if (localStorage.getItem('remember')) {
            this.rememberMe = localStorage.getItem('remember');
            this.Email= localStorage.getItem('email');
            this.Password = localStorage.getItem('password');

        }
        if (this.rememberMe) {
            $('.checkbox').addClass('checked');
        } else {
            $('.checkbox').removeClass('checked');
        }
    }


    Login(form) {
        if (form.valid) {
            const userObj = {
                Email: this.Email,
                Password: this.Password
            };
            this.authService.login(userObj).subscribe(data => {
                if(data.success){
                    this.router.navigate(['/product']);
                    this.authService.storeUserData(data.token, data.user);
                    if (this.rememberMe) {
                        localStorage.setItem('remember', this.rememberMe);
                        localStorage.setItem('email', this.Email);
                        localStorage.setItem('password', this.Password);
                    } else {
                        localStorage.removeItem('remember');
                        localStorage.removeItem('email');
                        localStorage.removeItem('password');

                    }

                }else{
                    this.isErrorMessage  = true;
                    this.errorMessage = data.message;
                }
                });
            }
        setTimeout(()=>{
            this.successMessage = false;
            this.isErrorMessage  = false;
        },1000)
    }

    changeRememberMe() {
        if (!this.rememberMe) {
            this.rememberMe = true;
            $('.checkbox').addClass('checked');
        } else {
            this.rememberMe = false;
            $('.checkbox').removeClass('checked');
        }
    }
}
