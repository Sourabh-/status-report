import { Component, OnInit } from '@angular/core';
import { AmChartsService, AmChart } from "@amcharts/amcharts3-angular";
import { AjaxService } from '../../../services/ajax.service';
import { Utilities } from '../../../services/utility.service';
import { GraphUtilities } from '../../../services/graph.service';

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.html',
  providers: []
})
export class DashboardComponent implements OnInit {
    private appVsEffChart: AmChart;
    private assoVsEffChart: AmChart;
    private colors = ["#FF0F00", "#FF6600", "#FF9E01", "#FCD202", "#8A0CCF", "#CD0D74"];
	constructor(private AmCharts: AmChartsService, private ajaxService: AjaxService, public utilities: Utilities, public gUtilities: GraphUtilities) {
		
	}

	ngOnInit() {
		//Fetch graph data for my applications vs no of hours
		this.ajaxService.fetchGraph("/graphs/apps/hours", {
			noOfDays: 365 * 5, 
			noOfApps: 99
		})
	    .subscribe(
	      data => {
	        if(data && data.length) {
	        	this.appVsEffChart.makeChart("chartdiv", this.gUtilities.getAppOrAssoVsHoursGraph(data));
	        }
	      },
	      error => {}
	    )

	    //Fetch graph data for my associates vs no of hours
		this.ajaxService.fetchGraph("/graphs/apps/hours", {
			noOfDays: 365 * 5, 
			noOfApps: 99
		})
	    .subscribe(
	      data => {
	        if(data && data.length) {
	        	this.assoVsEffChart.makeChart("chartdiv1", this.gUtilities.getAppOrAssoVsHoursGraph(data));
	        }
	      },
	      error => {}
	    )
	}
}