import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Http } from '@angular/http';

@Injectable()
export class DataFetcherService {

	obs = Observable.interval(100);
	URL = "http://webrates.truefx.com/rates/connect.html?c=EUR/USD&f=csv";
	dataFeed : string[] = new Array();

  constructor(private http:Http){
  	this.obs.subscribe(x=>{
      this.http.get(this.URL)
      .subscribe(res => {
        this.dataFeed = res.text().split(",")
      })
    })
  }

  getDataFeed(){
  	return Observable.of(this.dataFeed);
  }

}
