import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataFetcherService } from '../data-fetcher.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-forex',
  templateUrl: './forex.component.html',
  styleUrls: ['./forex.component.css']
})
export class ForexComponent implements OnInit {

	df;
	bidTable: number[] = new Array();
	offerTable: number[] = new Array();
	timeTable: Date[] = new Array();

	obs = Observable.interval(3000);


	@ViewChild('chart') el: ElementRef;

  constructor(private dataFetcher : DataFetcherService) { }

  ngOnInit() {
  	this.obs.subscribe(x=>{
  		this.dataFetcher.getDataFeed()
  		.subscribe(x=>{
  			this.df = x;
  			let t = new Date(Number(this.df[1]));
  			if( this.timeTable.length == 0 || (t.getTime() != this.timeTable[this.timeTable.length - 1].getTime()) ){
  				this.timeTable.push(t);
  				this.bidTable.push(Number(this.df[2] + this.df[3]));
  				this.offerTable.push(Number(this.df[4] + this.df[5]));
  				this.basicChart();
  			}
  		});
  	});	
  }

  basicChart(){
  	const element = this.el.nativeElement;
  	Plotly.purge(element);
  	
  	const data = [{
  		x: this.timeTable,
  		y: this.bidTable
  	}];

  	const style = {
  		margin: {t: 0}
  	};

  	Plotly.plot(element, data, style);

  }

}
