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
    private jiraVsAppChart: AmChart;
    private jiraVsAssoChart: AmChart;
    private colors = ["#FF0F00", "#FF6600", "#FF9E01", "#FCD202", "#8A0CCF", "#CD0D74"];
    public showSelf = false;
    public isAdmin = JSON.parse(this.utilities.getCookie("profile")).isAdmin;
    public graphData = {
    	appVsEffort: [],
    	assoVsEffort: [],
    	appVsJira: {},
    	assoVsJira: {}
    };

    public filterByDate = {
    	appVsEffort: 1,
    	assoVsEffort: 1,
    	appVsJira: 2,
    	assoVsJira: 2
    };

	constructor(private AmCharts: AmChartsService, private ajaxService: AjaxService, public utilities: Utilities, public gUtilities: GraphUtilities) {
		
	}

	ngOnInit() {
		this.handleSwitchGraphs(false);
	}

	handleSwitchGraphs(bool) {
		this.showSelf = bool;
		//Fetch graph data for my applications vs no of hours
		this.ajaxService.fetchGraph("/graphs/apps/hours", {
			noOfDays: 365 * 5, 
			noOfApps: 99,
			self: this.showSelf
		})
	    .subscribe(
	      data => {
	        if(data && data.length) {
	        	this.graphData.appVsEffort = data;
	        	this.appVsEffChart = this.AmCharts.makeChart("chartdiv", this.gUtilities.getAppOrAssoVsHoursGraph(data));
	        }
	      },
	      error => {}
	    )

	    //Fetch graph data for my associates vs no of hours
		this.ajaxService.fetchGraph("/graphs/users/hours", {
			noOfDays: 365 * 5, 
			noOfApps: 99,
			self: this.showSelf
		})
	    .subscribe(
	      data => {
	        if(data && data.length) {
	        	this.graphData.assoVsEffort = data;
	        	this.assoVsEffChart = this.AmCharts.makeChart("chartdiv1", this.gUtilities.getAppOrAssoVsHoursGraph(data));
	        }
	      },
	      error => {}
	    )

	    //Fetch JIRA-app graph
	    this.ajaxService.fetchGraph("/graphs/apps/tickets", {
	    	noOfMonths: this.filterByDate.appVsJira,
			self: this.showSelf
	    })
	    .subscribe(
	    	data => {
	    		//Example format: 
	    		/*{
					  2017: {
					    JAN: {
					       name: {
					         totalTickets:
					         totalClosedTickets: 
					       }
					    }
					  }
				  }*/
				if(data && Object.keys(data).length) {
		        	this.jiraVsAppChart = this.AmCharts.makeChart("chartdiv2", this.gUtilities.getAppOrAssoVsJiraGraph(data, "apps"));
		        }
	    	},
	    	error => {}
	    )

	    //Fetch JIRA-associate graph
	    this.ajaxService.fetchGraph("/graphs/users/tickets", {
	    	noOfMonths: this.filterByDate.assoVsJira,
			self: this.showSelf
	    })
	    .subscribe(
	    	data => {
	    		if(data && Object.keys(data).length) {
		        	this.jiraVsAssoChart = this.AmCharts.makeChart("chartdiv3", this.gUtilities.getAppOrAssoVsJiraGraph(data, "associates"));
		        }
	    	},
	    	error => {}
	    )

	    //Fetch all applications and use as filter, get pie chart for selected application
	}

	triggerFilter(type, value) {
		switch (type) {
			case "appVsEffort":
				this.appVsEffChart = this.AmCharts.makeChart("chartdiv", this.gUtilities.getAppOrAssoVsHoursGraph(this.graphData.appVsEffort, value));
				break;
			case "assoVsEffort":
				this.assoVsEffChart = this.AmCharts.makeChart("chartdiv1", this.gUtilities.getAppOrAssoVsHoursGraph(this.graphData.assoVsEffort, value));
				break;
			case "appVsJira":
				this.ajaxService.fetchGraph("/graphs/apps/tickets", {
			    	noOfMonths: value,
					self: this.showSelf
			    })
			    .subscribe(
			    	data => {
						if(data && Object.keys(data).length) {
				        	this.jiraVsAppChart = this.AmCharts.makeChart("chartdiv2", this.gUtilities.getAppOrAssoVsJiraGraph(data, "apps"));
				        }
			    	},
			    	error => {}
			    )
				break;
			case "assoVsJira":
				this.ajaxService.fetchGraph("/graphs/users/tickets", {
			    	noOfMonths: value,
					self: this.showSelf
			    })
			    .subscribe(
			    	data => {
			    		if(data && Object.keys(data).length) {
				        	this.jiraVsAssoChart = this.AmCharts.makeChart("chartdiv3", this.gUtilities.getAppOrAssoVsJiraGraph(data, "associates"));
				        }
			    	},
			    	error => {}
	    		)
				break;
		}
	}
}