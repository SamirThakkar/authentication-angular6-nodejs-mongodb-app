import {  NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {LoginRoutingModule} from './login-routing.module';
import {LoginComponent} from './login.component';
import {AuthService} from '../shared/auth.service';

@NgModule({
    imports: [
        HttpModule,
        FormsModule,
        CommonModule,
        LoginRoutingModule
    ],
    declarations: [LoginComponent],
    providers:[AuthService]
})
export class LoginModule {}
