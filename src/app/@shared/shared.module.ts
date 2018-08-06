import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
// import 'rxjs/add/operator/map';
import {AuthGuard} from './auth.guard';
import {AuthService} from '../modules/auth/shared/auth.service';
import {NotAuthGuard} from './notAuth.guard';

@NgModule({
    declarations: [
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule
    ],
    providers: [AuthGuard, AuthService , NotAuthGuard],
    bootstrap: []
})

export class SharedModule {}
