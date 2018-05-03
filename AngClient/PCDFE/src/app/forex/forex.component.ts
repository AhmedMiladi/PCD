import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataFetcherService } from '../data-fetcher.service';
import { Observable } from 'rxjs';
import * as tf from '@tensorflow/tfjs';


@Component({
  selector: 'app-forex',
  templateUrl: './forex.component.html',
  styleUrls: ['./forex.component.css']
})
	/*responsible for plotting and user operations*/
export class ForexComponent implements OnInit {
	df;
  model;
  latestBid: number;
	timeTable: Date[] = new Array();
  openTable: number[] = new Array();
  lowTable: number[] = new Array();
  highTable: number[] = new Array();
  closeTable: number[] = new Array();
	accountValue : number = 10000;
	purchaseDates: Date[] = new Array();
  movingAverageArray: number[] = new Array();

	obs = Observable.interval(250);


	@ViewChild('chart') el: ElementRef;

  constructor(private dataFetcher : DataFetcherService) { }
  //getting and plotting data every 0.25s 
  ngOnInit() {
    let instantMax = 0;
    let instantMin = 1000000;
    let lastEntry = 0;
    let addedOpenElt = false;
    let addedCloseElt = false;

    //this.loadModel('../../assets/model_json/model.json');

  	this.obs.subscribe(tick=>{
      this.dataFetcher.getDataFeed()
      .subscribe(x=>{

        this.df = x;
        let t = new Date();
        let currentBid = Number(this.df[2] + this.df[3]);
        let currentOffer = Number(this.df[4] + this.df[5]);
        let plot = false;

        if(this.timeTable.length > 1){
          lastEntry = (t.getSeconds() - this.timeTable[this.timeTable.length - 1].getSeconds())%60
        }

        if(currentBid > instantMax){
          instantMax = currentBid;
          if(this.highTable.length > 1){
            this.highTable[this.highTable.length - 1] = instantMax;
            if(!plot){plot = true;}
          }
        }

        if(currentBid < instantMin){
          instantMin = currentBid;
          if(this.lowTable.length > 1){
           this.lowTable[this.lowTable.length - 1] = instantMin;
           if(!plot){plot = true;}
          }
        }

        if(t.getSeconds() != 0 && addedOpenElt){addedOpenElt = false;}
        if(t.getSeconds() != 59 && addedCloseElt){addedCloseElt = false;}

        if(t.getSeconds() == 0 && !addedOpenElt || 
          this.openTable.length <= 1 || lastEntry > 60)
        {
          this.openTable.push(currentBid);
          this.timeTable.push(t);
          if(!plot){plot = true;}
          addedOpenElt = true;
          //console.log("open: ", this.openTable);
        }

        if(t.getSeconds() == 59 && t.getMilliseconds() > 500 && !addedCloseElt || this.highTable.length <= 1 ||
          this.lowTable.length <= 1 || this.closeTable.length <= 1 || lastEntry > 60)
        {
          this.highTable.push(instantMax);
          this.lowTable.push(instantMin);
          this.closeTable.push(currentBid);
          if(!plot){plot = true;}
          instantMax = 0;
          instantMin = 1000000;
          addedCloseElt = true;

          if(this.closeTable.length > 20){
            let s = 0;
            for(let i = this.closeTable.length - 1; i >= this.closeTable.length - 20; i--){
              s += this.closeTable[i];
            }
            this.movingAverageArray.push(s/20);
          }
          else{this.movingAverageArray.push(NaN);}

          /*console.log("high: ", this.highTable);
          console.log("low: ", this.lowTable);
          console.log("close: ", this.closeTable);
          console.log("MA: ", this.movingAverageArray);*/
        }

        if(currentBid != this.closeTable[this.closeTable.length - 1] && this.closeTable.length > 0){
          this.closeTable[this.closeTable.length - 1] = currentBid;
          if(!plot){plot = true;}
        }
        if(plot){this.basicChart();}
        
  		});
  	});	
  }

  //plotting data
  basicChart(){
  	const element = this.el.nativeElement;
  	Plotly.purge(element);
  	
    let rangeStart = (this.timeTable.length >= 20) ? this.timeTable[this.timeTable.length-20]:this.timeTable[0];
  	const data = [{
  		x: this.timeTable,
      close: this.closeTable,
      decreasing: {line: {color: '#7F7F7F'}},
      high: this.highTable,
      increasing: {line: {color: '#17BECF'}},
      line: {color: 'rgba(31,119,180,1)'},
      low: this.lowTable,
      open: this.openTable,
      type: 'candlestick', 
      xaxis: 'x', 
      yaxis: 'y',
      name: 'OHLC'
    },{
      x: this.timeTable,
      y: this.movingAverageArray,
      line: {color: 'rgba(180,119,31,1)', shape: 'spline',  dash: 'solid'},
      type : 'scatter'
    }];

  	const style = {
  		margin: {t: 100},
      dragmode: 'zoom',
      xaxis: {
        range: [new Date(Number(rangeStart) - 30000), 
        new Date(Number(this.timeTable[this.timeTable.length-1]) + 30000)]
      }
  	};

  	Plotly.plot(element, data, style, {scrollZoom: true});
  }

  /*async loadModel(filePath){
    this.model = await tf.loadModel(filePath);
  }*/

  //adds user operations history and calculating gain/loss


}