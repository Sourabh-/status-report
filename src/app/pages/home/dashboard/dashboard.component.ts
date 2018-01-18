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

//TO DO
//Too many fetchGraph calls, clean it up and move to a single function

export class DashboardComponent implements OnInit {
    private appVsEffChart: AmChart;
    private assoVsEffChart: AmChart;
    private jiraVsAppChart: AmChart;
    private jiraVsAssoChart: AmChart;
    private appPieChart: AmChart;
    private assoPieChart: AmChart;
    public showSelf = false;
    public profile = JSON.parse(this.utilities.getCookie("profile"));
    public isAdmin = this.profile.isAdmin;
    public ownedApplications = [];
    public myApplications = [];
    public shownApplications = [];
    public users = [];
    public graphData = {
    	appVsEffort: [],
    	assoVsEffort: []
    };

    public filterByDate = {
    	appVsEffort: 1,
    	assoVsEffort: 1,
    	appVsJira: 2,
    	assoVsJira: 2,
    	appPieChart: 20,
    	assoPieChart: 20,
    	appByNamePieChart: '',
    	assoByNamePieChart: ''
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
		        	this.jiraVsAppChart = this.AmCharts.makeChart("chartdiv2", this.gUtilities.getAppOrAssoVsJiraGraph(data, "app"));
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
		        	this.jiraVsAssoChart = this.AmCharts.makeChart("chartdiv3", this.gUtilities.getAppOrAssoVsJiraGraph(data, "associate"));
		        }
	    	},
	    	error => {}
	    )

	    //Fetch all applications and use as filter, get pie chart for selected application
	    if(this.isAdmin) {
			//Get all owned applications
			this.ajaxService.getApp({
				ownerEmailId: JSON.parse(this.utilities.getCookie("profile")).emailId
			})
		    .subscribe(
		      data => {
		      	if(data && data.length) {
		      		this.ownedApplications = data;
		        	this.shownApplications = data;
		        	this.filterByDate.appByNamePieChart = data[0].applicationName;
		        	//Get pie chart data
		        	this.ajaxService.fetchGraph("/graphs/apps/hours/" + this.filterByDate.appByNamePieChart, {
		        		noOfDays: this.filterByDate.appPieChart,
		        		self: this.showSelf
		        	})
		        	.subscribe(
		        		data => {
		        			if(data) {
		        				this.appPieChart = this.AmCharts.makeChart("chartdiv4", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
		        			}
		        		},
		        		error => {

		        		}
		        	)
		      	}
		      },
		      error => {

		      }
		    )

		    //Get all users
		    this.ajaxService.searchUser({})
		    .subscribe(
		    	data => {
		    		if(data && data.length) {
		    			this.users = data;
		    			this.filterByDate.assoByNamePieChart = this.showSelf ? JSON.parse(this.utilities.getCookie("profile")).emailId : data[0].emailId;
		    			//Get user's pie chart data
		    			this.ajaxService.fetchGraph("/graphs/users/hours/" + this.filterByDate.assoByNamePieChart, {
			        		noOfDays: this.filterByDate.assoPieChart,
			        		self: this.showSelf
			        	})
			        	.subscribe(
			        		data => {
			        			if(data) {
			        				this.assoPieChart = this.AmCharts.makeChart("chartdiv5", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
			        			}
			        		},
			        		error => {

			        		}
			        	)
		    		}
		    	},
		    	error => {

		    	}
		    )
		} else {
			this.filterByDate.assoByNamePieChart = JSON.parse(this.utilities.getCookie("profile")).emailId;
			//Get user's pie chart data
			this.ajaxService.fetchGraph("/graphs/users/hours/" + this.filterByDate.assoByNamePieChart, {
        		noOfDays: this.filterByDate.assoPieChart,
        		self: this.showSelf
        	})
        	.subscribe(
        		data => {
        			if(data) {
        				this.assoPieChart = this.AmCharts.makeChart("chartdiv5", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
        			}
        		},
        		error => {

        		}
        	)
		}

		//Get all assigned applications
		this.ajaxService.getApp({
			assigneeEmailId: JSON.parse(this.utilities.getCookie("profile")).emailId
		})
	    .subscribe(
	      data => {
	        this.myApplications = data ? data : [];
	        if(!this.isAdmin && data && data.length) {
	        	this.shownApplications = data;
	        	this.filterByDate.appByNamePieChart = data[0].applicationName;
	        	//Get pie chart data
	        	this.ajaxService.fetchGraph("/graphs/apps/hours/" + this.filterByDate.appByNamePieChart, {
	        		noOfDays: this.filterByDate.appPieChart,
	        		self: this.showSelf
	        	})
	        	.subscribe(
	        		data => {
	        			if(data) {
	        				this.appPieChart = this.AmCharts.makeChart("chartdiv4", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
	        			}
	        		},
	        		error => {

	        		}
	        	)
	        }
	      },
	      error => {

	      }
	    )
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
				        	this.jiraVsAssoChart = this.AmCharts.makeChart("chartdiv3", this.gUtilities.getAppOrAssoVsJiraGraph(data, "associate"));
				        }
			    	},
			    	error => {}
	    		)
				break;
			case 'appPieChart':
		        //Get pie chart data
	        	this.ajaxService.fetchGraph("/graphs/apps/hours/" + this.filterByDate.appByNamePieChart, {
	        		noOfDays: value,
	        		self: this.showSelf
	        	})
	        	.subscribe(
	        		data => {
	        			if(data) {
	        				this.appPieChart = this.AmCharts.makeChart("chartdiv4", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
	        			}
	        		},
	        		error => {

	        		}
	        	)
				break;
			case 'assoPieChart':
				this.ajaxService.fetchGraph("/graphs/users/hours/" + this.filterByDate.assoByNamePieChart, {
	        		noOfDays: value,
	        		self: this.showSelf
	        	})
	        	.subscribe(
	        		data => {
	        			if(data) {
	        				this.assoPieChart = this.AmCharts.makeChart("chartdiv5", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
	        			}
	        		},
	        		error => {

	        		}
	        	)
				break;
			case 'appByNamePieChart':
				this.ajaxService.fetchGraph("/graphs/apps/hours/" + value, {
	        		noOfDays: this.filterByDate.appPieChart,
	        		self: this.showSelf
	        	})
	        	.subscribe(
	        		data => {
	        			if(data) {
	        				this.appPieChart = this.AmCharts.makeChart("chartdiv4", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
	        			}
	        		},
	        		error => {

	        		}
	        	)
				break;
			case 'assoByNamePieChart':
				this.ajaxService.fetchGraph("/graphs/users/hours/" + value, {
	        		noOfDays: this.filterByDate.assoPieChart,
	        		self: this.showSelf
	        	})
	        	.subscribe(
	        		data => {
	        			if(data) {
	        				this.assoPieChart = this.AmCharts.makeChart("chartdiv5", this.gUtilities.getAppNAssoPieChart(data, "noOfHours", "name"));
	        			}
	        		},
	        		error => {

	        		}
	        	)
				break;
		}
	}
}