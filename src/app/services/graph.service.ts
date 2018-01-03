import { Injectable } from "@angular/core";
import {monthToKeys} from "../data/data";
@Injectable()
export class GraphUtilities {
	monthToKeys = monthToKeys;

	calculateMonths(graph, data, length) {
		graph.categoryField = "month";
		let number;
		let currentMonth = new Date().getMonth()+1;
		let currentYear = new Date().getFullYear();
		for(let i=0; i<length; i++) {
			if(i == 0) {
				graph.dataProvider.push({
					"id": currentMonth,
					"month": monthToKeys[currentMonth] + "/" + new Date().getFullYear()
				});
			} else {
				graph.dataProvider.push({
					"id": (currentMonth-i) <= 0 ? (12+(currentMonth-i)) : (currentMonth-i),
					"month": monthToKeys[(currentMonth-i) <= 0 ? (12+(currentMonth-i)) : (currentMonth-i)] + "/" + (((currentMonth-i)) <= 0 ? (currentYear-1) : currentYear)
				});
			}
		}

		graph.dataProvider.reverse();
		for(let i=0; i<data.length; i++) {
			for(let j=0; j<graph.dataProvider.length; j++) {
				if(graph.dataProvider[j].id == (new Date(data[i].fromDate).getMonth()+1)) {
					number = j;
					for(let key in data[i]) {
						if(["fromDate", "toDate"].indexOf(key) == -1) {
							if(!graph.dataProvider[j][key]) graph.dataProvider[j][key] = 0;
							graph.dataProvider[j][key] += data[i][key];
						}
					}
					break;
				}
			}
		}

		if(typeof number != 'undefined')
			for(let key in graph.dataProvider[number]) {
				if(["month", "id"].indexOf(key) == -1) {
					graph.graphs.push({
						"balloonText": key + ": [[value]]",
						"fillAlphas": 0.8,
						"lineAlpha": 0.2,
						"title": key,
						"type": "column",
						"valueField": key
					});
				}
			}

		return graph;
	}

	getAppOrAssoVsHoursGraph(data, filter?) {
		let graph = {
	      	"type": "serial",
		    "theme": "light",
			"categoryField": "",
			"depth3D": 20,
			"angle": 30,
			"startDuration": 1,
			"categoryAxis": {
				"gridPosition": "start",
				"position": "left",
				"axisAlpha": 0,
				"gridAlpha": 0
			},
			"trendLines": [],
			"graphs": [],
			"guides": [],
			"valueAxes": [
				{
					"position": "top",
					"axisAlpha": 0
				}
			],
			"allLabels": [],
			"balloon": {},
			"titles": [],
			"dataProvider": []
	    };

	    //Data {from, to, [appname]: totalHoursWorked}
		if(!filter || filter == 1) {//3Weeks
			graph.categoryField = "week";
			let flag = 0;
			let count = 0;
			for(let i=0; i<data.length; i++) {
				if(data[i].fromDate > (new Date().getTime() - (22 * 24 * 60 * 60 * 1000))) {
					let fromDate = new Date(data[i].fromDate);
					let toDate = new Date(data[i].toDate);
					let tmp = {
						"week": ((fromDate.getDate() + "/" + monthToKeys[fromDate.getMonth()+1] + "/" + fromDate.getFullYear()) + " - " + (toDate.getDate() + "/" + monthToKeys[toDate.getMonth()+1] + "/" + toDate.getFullYear()))	
					}


					for(let key in data[i]) {
						if(["fromDate", "toDate"].indexOf(key) == -1) {
							tmp[key] = data[i][key];
							if(flag == 0) {
								count++;
								if(count == (Object.keys(data[i]).length-2)) flag = 1;
								graph.graphs.push({
									"balloonText": key + ": [[value]]",
									"fillAlphas": 0.8,
									"lineAlpha": 0.2,
									"title": key,
									"type": "column",
									"valueField": key
								});
							}
						}
					}

					graph.dataProvider.push(tmp);
				}
			}
		} else if(filter <= 12) {
			graph = this.calculateMonths(graph, data, filter);
		} else if(filter > 12) {
			graph.categoryField = "year";
			let yearsData = {};
			for(let i=0; i<data.length; i++) {
				let year = new Date(data[i].fromDate).getFullYear();
				if(!yearsData[year]) yearsData[year] = {};
				for(let key in data[i]) {
					if(["fromDate", "toDate"].indexOf(key) == -1) {
						if(!yearsData[year][key]) yearsData[year][key] = 0;
						yearsData[year][key] += data[i][key];
					}
				}
			}

			let flag = 0;
			for(let key in yearsData) {
				let tmp = {
					"year": key
				};
				for(let key2 in yearsData[key]) {
					tmp[key2] = yearsData[key][key2];
					if(flag == 0) {
						graph.graphs.push({
							"balloonText": key2 + ": [[value]]",
							"fillAlphas": 0.8,
							"lineAlpha": 0.2,
							"title": key2,
							"type": "column",
							"valueField": key2
						});
					}
				}
				
				flag = 1;
				graph.dataProvider.push(tmp);
			}
		}

		return graph;
	}

	getAppOrAssoVsJiraGraph(data, category) {
		let graph = {
	      	"type": "serial",
		    "theme": "light",
			"categoryField": category,
			"depth3D": 20,
			"angle": 30,
			"startDuration": 1,
			"categoryAxis": {
				"gridPosition": "start",
				"position": "left",
				"axisAlpha": 0,
				"gridAlpha": 0
			},
			"trendLines": [],
			"graphs": [{
				"balloonText": "Closed JIRA tickets: [[value]]",
				"fillAlphas": 0.8,
				"lineAlpha": 0.2,
				"title": "Closed JIRA tickets",
				"type": "column",
				"valueField": "totalJiraTickets"
			}, {
				"balloonText": "Total JIRA tickets: [[value]]",
				"fillAlphas": 0.8,
				"lineAlpha": 0.2,
				"title": "Total JIRA tickets",
				"type": "column",
				"valueField": "closedJiraTickets"
			}],
			"guides": [],
			"valueAxes": [
				{
					"position": "top",
					"axisAlpha": 0
				}
			],
			"allLabels": [],
			"balloon": {},
			"titles": [],
			"dataProvider": []
	    };

	    for(let yr in data) {
	    	for(let mnth in data[yr]) {
	    		for(let key in data[yr][mnth]) {
	    			let tmp = {
	    				[category]: key,
	    				closedJiraTickets: data[yr][mnth][key].totalTickets,
	    				totalJiraTickets: data[yr][mnth][key].totalClosedTickets
	    			};
	    			graph.dataProvider.push(tmp);
	    		}
	    	}
	    }

	    return graph;
	}
}