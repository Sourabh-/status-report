import { Component, OnInit } from '@angular/core';
import { AmChartsService, AmChart } from "@amcharts/amcharts3-angular";
import { AjaxService } from '../../../services/ajax.service';
import { Utilities } from '../../../services/utility.service';

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.html',
  providers: []
})
export class DashboardComponent implements OnInit {
    private chart: AmChart;
    private colors = ["#FF0F00", "#FF6600", "#FF9E01", "#FCD202", "#8A0CCF", "#CD0D74"];
	constructor(private AmCharts: AmChartsService, private ajaxService: AjaxService, public utilities: Utilities) {
		
	}

	ngOnInit() {
		//Fetch graph data for my applications vs no of hours
		this.ajaxService.fetchGraph("/graphs/apps/hours", {
			noOfDays: 7, 
			noOfApps: 6
		})
	    .subscribe(
	      data => {
	        if(data && Object.keys(data).length) {
	        	let graphArr = [];
	        	let count = 0;
	        	for(let key in data) {
	        		data[key].color = this.colors[++count];
	        		graphArr.push(data[key]);
	        	}
	        	this.chart = this.AmCharts.makeChart("chartdiv", {
			      "type": "serial",
			      "theme": "light",
			      "dataProvider": graphArr,
			      "categoryField": "applicationName",
			      "startDuration": "1",
			      "chartCursor": {
				    "categoryBalloonEnabled": false,
				    "cursorAlpha": 0,
				    "zoomable": false
				  },
			      "valueAxes": [{
				    "axisAlpha": 0,
				    "position": "left",
				    "title": "Total No. Of Hours"
				  }],
				  "graphs": [{
				  	"balloonText": "<b>[[category]]: [[value]]</b>",
				    "valueField": "totalNoOfHours",
				    "type": "line",
				    "fillColorsField": "color",
    				"fillAlphas": 0.9,
    				"lineAlpha": 0.2
				  }],
				  "categoryAxis": {// ... other category axis settings
		  			 "labelRotation": 32
				  }	
			    });
	        }
	      },
	      error => {}
	    )
	}
}