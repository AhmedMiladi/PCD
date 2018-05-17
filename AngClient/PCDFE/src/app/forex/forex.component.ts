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
  predictionOpen: number[] = new Array();
  predictionHigh: number[] = new Array();
  predictionLow: number[] = new Array();
  predictionClose: number[] = new Array();
  predictionTime: Date[] = new Array();


  

  //for fetching data every 250ms
	obs = Observable.interval(250);

  //for fetching model every 15min
  obsModel = Observable.interval(15*60*1000);
  loadingModel = false;


	@ViewChild('chart') el: ElementRef;

  constructor(private dataFetcher : DataFetcherService) { }
  //getting and plotting data every 0.25s 
  ngOnInit() {
    let instantMax = 0;
    let instantMin = 1000000;
    let lastEntry = 0;
    let addedOpenElt = false;
    let addedCloseElt = false;
    let addPredict = false;

    //tensor of zeros of shape [40, 1]
    const predictionTensor = tf.variable(tf.zeros([1, 10, 4]));
    //predictionTensor.print();

    //initial model loading
    this.loadModel('../../assets/model_json/model.json').then(()=>{
      this.loadingModel = false;
      console.log("modelLoading = ", this.loadingModel);
      console.log("model : ", this.model);
    });

    //loading model every 15min
    this.obsModel.subscribe(m => {
      console.log(m);
      this.loadModel('../../assets/model_json/model.json').then(()=>{
      this.loadingModel = false;
      console.log("modelLoading = ", this.loadingModel);
      console.log("model : ", this.model);
    });
  });

    //fetching data every 250ms
  	this.obs.subscribe(tick=>{
      this.dataFetcher.getDataFeed()
      .subscribe(x=>{
        let t = new Date();
        let currentBid = Number(x[2] + x[3]);
        let currentOffer = Number(x[4] + x[5]);
        let plot = false;
        //let start = new Date();

        //to make sure last entry happened in less than 1 minute behind
        if(this.timeTable.length > 1){
          lastEntry = (t.getSeconds() - this.timeTable[this.timeTable.length - 1].getSeconds()) % 60;
        }

        //calculate high value
        if(currentBid > instantMax){
          instantMax = currentBid;
          if(this.highTable.length > 1){
            this.highTable[this.highTable.length - 1] = instantMax;
            if(!plot){plot = true;}
          }
        }

        //calculate low value
        if(currentBid < instantMin){
          instantMin = currentBid;
          if(this.lowTable.length > 1){
           this.lowTable[this.lowTable.length - 1] = instantMin;
           if(!plot){plot = true;}
          }
        }

        //to make sure that the OHLC tables update 1/minute
        if(t.getSeconds() != 0 && addedOpenElt){ addedOpenElt = false; }
        if(t.getSeconds() != 59 && addedCloseElt){ addedCloseElt = false; }

        //open and time
        if(t.getSeconds() == 0 && !addedOpenElt || 
          this.openTable.length <= 1 || lastEntry > 60)
        {
          this.openTable.push(currentBid);
          this.timeTable.push(t);
          if(!plot){plot = true;}
          addedOpenElt = true;
          //console.log("open: ", this.openTable);
        }

        //high, low and close
        if(t.getSeconds() == 59 && !addedCloseElt || this.highTable.length <= 1 ||
          this.lowTable.length <= 1 || this.closeTable.length <= 1 || lastEntry > 60)
        {
          this.highTable.push(instantMax);
          this.lowTable.push(instantMin);
          this.closeTable.push(currentBid);
          if(!plot){plot = true;}
          instantMax = 0;
          instantMin = 1000000;
          addedCloseElt = true;
          addPredict = true;

          //moving average
          if(this.closeTable.length > 7){
            let s = 0;
            for(var i = this.closeTable.length - 1; i >= this.closeTable.length - 5; i--){
              s += this.closeTable[i];
            }
            this.movingAverageArray.push(s/5);
          }
          else{this.movingAverageArray.push(NaN);} //to offset time

          /*console.log("high: ", this.highTable);
          console.log("low: ", this.lowTable);
          console.log("close: ", this.closeTable);
          console.log("MA: ", this.movingAverageArray);*/
        }

        //to update closing value for the present period
        if(currentBid != this.closeTable[this.closeTable.length - 1] && this.closeTable.length > 0){
          this.closeTable[this.closeTable.length - 1] = currentBid;
          if(!plot){ plot = true; }
        }


        //making predictions
        if(addPredict && this.closeTable.length > 12){
          let inputOpen = [];
          let inputHigh = [];
          let inputLow = [];
          let inputClose = [];

          //to initialise prediction input
          for(var ind = this.closeTable.length -11; ind < this.closeTable.length - 1; ind ++){
            inputOpen.push(this.openTable[ind]);
            inputHigh.push(this.highTable[ind]);
            inputLow.push(this.lowTable[ind]);
            inputClose.push(this.closeTable[ind]);
          }

          //used for prediction
          let x_max = [0, 0, 0, 0];
          let x_min = [0, 0, 0, 0];
          let x_std = [0, 0, 0, 0];
          let inputMatrix = [];
          let a = [];
          this.predictionOpen = [];
          this.predictionHigh = [];
          this.predictionLow = [];
          this.predictionClose = [];
          this.predictionTime = [];

          addPredict = false;

          console.log("predicting...");
          for(var i = 0; i < 10; i++){
            inputMatrix = [inputOpen].concat([inputHigh]).concat([inputLow]).concat([inputClose]);

            //input x's value transformed to a value between -1 and 1
            for(var ind = 0; ind < 4; ind++){
              inputMatrix[ind] = inputMatrix[ind].map(x=>{
                x_max[ind] = Math.max(...inputMatrix[ind]);
                x_min[ind] = Math.min(...inputMatrix[ind]);
                x_std[ind] = (x - x_min[ind])/(x_max[ind] - x_min[ind]);
                return((2 * x_std[ind]) - 1);
              });
            }

            //prediction
            predictionTensor.assign(tf.tensor([this.transpose(inputMatrix)]));
            a = this.model.predict(predictionTensor).dataSync().map( (x, ind)=>{
                  return( (0.5 * (x + 1) * (x_max[ind] - x_min[ind])) + 1 );
                });

            //for plotting
            this.predictionOpen.push(a[0]);
            this.predictionHigh.push(a[1]);
            this.predictionLow.push(a[2]);
            this.predictionClose.push(a[3]);
            this.predictionTime.push(new Date(t.getTime() + 60*1000*i));

            //to prepare for next prediction
            inputOpen.push(a[0]);
            inputOpen.shift();
            inputHigh.push(a[1]);
            inputHigh.shift();
            inputLow.push(a[2]);
            inputLow.shift();
            inputClose.push(a[3]);
            inputClose.shift();
          }

        }

        //plotting
        if(plot){this.basicChart();}

        //let finish = new Date()
        //if(finish.getTime() - start.getTime()){console.log("loop time : ", finish.getTime() - start.getTime());}
  		});
  	});	
  }

  //plotting data
  basicChart(){
  	const element = this.el.nativeElement;
  	Plotly.purge(element);
  	
    let rangeStart = (this.timeTable.length >= 20) ? this.timeTable[this.timeTable.length-20] : this.timeTable[0];
    let rangeEnd = (this.predictionTime.length > 0) ? this.predictionTime[this.predictionTime.length-1] : this.timeTable[this.timeTable.length-1];
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
      type : 'scatter',
      name: 'MA_5min'
    },{
      x: this.predictionTime,
      close: this.predictionClose,
      decreasing: {line: {color: '#7F5555'}},
      high: this.predictionHigh,
      increasing: {line: {color: '#5555CF'}},
      line: {color: 'rgba(31,180,119,0.75)'},
      low: this.predictionLow,
      open: this.predictionOpen,
      type: 'candlestick', 
      xaxis: 'x', 
      yaxis: 'y',
      name: 'prediction'
    }];

  	const style = {
  		margin: {t: 100},
      dragmode: 'zoom',
      xaxis: {
        range: [new Date(Number(rangeStart) - 30000), 
        new Date(Number(rangeEnd) + 30000)]
      }
  	};

  	Plotly.plot(element, data, style, {scrollZoom: true});
  }

  async loadModel(filePath){
    this.loadingModel = true;
    this.model = await tf.loadModel(filePath);
  }

  transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map(row => row[i]));
}
  //adds user operations history and calculating gain/loss


}