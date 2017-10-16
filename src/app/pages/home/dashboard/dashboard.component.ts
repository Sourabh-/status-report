import { Component, OnInit } from '@angular/core';
import { AmChartsService, AmChart } from "@amcharts/amcharts3-angular";

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.html',
  providers: []
})
export class DashboardComponent implements OnInit {
  private chart: AmChart;
  private chart1: AmChart;
  private chart2: AmChart;
  private chart3: AmChart;
  private chart4: AmChart;
  private chart5: AmChart;
  
  chartData = [ {
    "country": "USA",
    "visits": 4252
  }, {
    "country": "China",
    "visits": 1882
  }, {
    "country": "Japan",
    "visits": 1809
  }, {
    "country": "Germany",
    "visits": 1322
  }, {
    "country": "UK",
    "visits": 1122
  }, {
    "country": "France",
    "visits": 1114
  }, {
    "country": "India",
    "visits": 984
  }, {
    "country": "Spain",
    "visits": 711
  }, {
    "country": "Netherlands",
    "visits": 665
  }, {
    "country": "Russia",
    "visits": 580
  }];

	constructor(private AmCharts: AmChartsService) {
		
	}

	ngOnInit() {
		
		this.chart = this.AmCharts.makeChart("chartdiv", {
	      "type": "serial",
	      "theme": "light",
	      "dataProvider": this.chartData,
	      "categoryField": "country",
		  "graphs": [ {
		    "valueField": "visits",
		    "type": "column"
		  }],
		  "categoryAxis": {// ... other category axis settings
  			 "labelRotation": 90
		  }		
	    });

	    this.chart2 = this.AmCharts.makeChart("chartdiv1", {
	      "type": "serial",
	      "theme": "light",
	      "dataProvider": this.chartData,
	      "categoryField": "country",
		  "graphs": [ {
		    "valueField": "visits",
		    "type": "column"
		  } ]
	    });

	    this.chart2 = this.AmCharts.makeChart("chartdiv2", {
	      "type": "serial",
	      "theme": "light",
	      "dataProvider": this.chartData,
	      "categoryField": "country",
		  "graphs": [ {
		    "valueField": "visits",
		    "type": "column"
		  } ]
	    });

	    this.chart3 = this.AmCharts.makeChart("chartdiv3", {
	      "type": "serial",
	      "theme": "light",
	      "dataProvider": this.chartData,
	      "categoryField": "country",
		  "graphs": [ {
		    "valueField": "visits",
		    "type": "column"
		  } ]
	    });

	    this.chart4 = this.AmCharts.makeChart("chartdiv4", {
	      "type": "serial",
	      "theme": "light",
	      "dataProvider": this.chartData,
	      "categoryField": "country",
		  "graphs": [ {
		    "valueField": "visits",
		    "type": "column"
		  } ]
	    });

	    this.chart5 = this.AmCharts.makeChart("chartdiv5", {
	      "type": "serial",
	      "theme": "light",
	      "dataProvider": this.chartData,
	      "categoryField": "country",
		  "graphs": [ {
		    "valueField": "visits",
		    "type": "column"
		  } ]
	    });
	}
}