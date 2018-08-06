import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {AuthService} from '../../modules/auth/shared/auth.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {

    constructor(
        public authService: AuthService,
        private router: Router,
    ) { }

    // Function to logout user
    onLogoutClick() {
        this.authService.logout(); // Logout user
        this.router.navigate(['/']); // Navigate back to home page
    }

    ngOnInit() {
    }

}
