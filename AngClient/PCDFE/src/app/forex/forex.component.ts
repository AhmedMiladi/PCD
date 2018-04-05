import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataFetcherService } from '../data-fetcher.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-forex',
  templateUrl: './forex.component.html',
  styleUrls: ['./forex.component.css']
})
	/*responsible for plotting and user operations*/
export class ForexComponent implements OnInit {
	df;
	bidTable: number[] = new Array();
	offerTable: number[] = new Array();
	timeTable: Date[] = new Array();
	investedAmount: string = "0";
	investedValue: number = 0;
	gainLoss: number = 0;
	totalInvested : number = 0;
	accountValue : number = 10000;
	purchaseDates: Date[] = new Array();
	investedTable: number[] = new Array();

	obs = Observable.interval(1000);


	@ViewChild('chart') el: ElementRef;

  constructor(private dataFetcher : DataFetcherService) { }
  //getting and plotting data every 0.25s 
  ngOnInit() {
  	this.obs.subscribe(x=>{
  		this.dataFetcher.getDataFeed()

  		.subscribe(x=>{
  			this.df = x;
  			let t = new Date(Number(this.df[1]));

  			if( this.timeTable.length == 0 || (t.getTime() != this.timeTable[this.timeTable.length - 1].getTime()) )
  			{
  				this.timeTable.push(t);
  				this.bidTable.push(Number(this.df[2] + this.df[3]));
  				this.offerTable.push(Number(this.df[4] + this.df[5]));
  				this.gainLoss = ( this.bidTable[this.bidTable.length - 1] * this.totalInvested) - this.investedValue;
  				this.basicChart();
  			}

  		});

  	});	
  }

  //plotting data
  basicChart(){
  	const element = this.el.nativeElement;
  	Plotly.purge(element);
  	
  	const data = [{
  		x: this.timeTable,
  		y: this.bidTable
  	}];

  	const style = {
  		margin: {t: 100}
  	};

  	Plotly.plot(element, data, style);
  }

  //adds user operations history and calculating gain/loss
  invest(){
  	let iv = Number(this.investedAmount)
  	if(iv > 0){
	  	this.investedValue += this.bidTable[this.bidTable.length - 1] * iv;
  		this.accountValue -= this.bidTable[this.bidTable.length - 1] * iv;
	  	this.purchaseDates.push(this.timeTable[this.timeTable.length -1]);
  		this.investedTable.push(iv);
  		this.totalInvested += iv;
  	}
  	this.investedAmount = "0";
  	console.log(this.investedValue);
  	console.log(this.totalInvested);
  	console.log(this.gainLoss);
  }

  sell(){
  	this.accountValue += this.gainLoss * this.totalInvested;
  	this.totalInvested = 0;
  	this.investedValue = 0;
  }


}