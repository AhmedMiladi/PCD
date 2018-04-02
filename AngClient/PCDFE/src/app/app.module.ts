import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import { DataFetcherService } from './data-fetcher.service';
import { ForexComponent } from './forex/forex.component';


@NgModule({
  declarations: [
    AppComponent,
    ForexComponent
  ],
  imports: [
    BrowserModule,
  	HttpModule,
    FormsModule
  ],
  providers: [
  	DataFetcherService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
