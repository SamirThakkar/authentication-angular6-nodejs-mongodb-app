import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import {RouteModule} from './app.route';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {SharedModule} from './@shared/shared.module';
import {HeaderComponent} from './@shared/header/header.component';

@NgModule({
  declarations: [
    HeaderComponent,
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    SharedModule,
    RouteModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
