import { Component, OnInit } from '@angular/core';
import { AjaxService } from '../../../services/ajax.service';
import { Utilities } from '../../../services/utility.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'page-effort',
  templateUrl: './effort.html',
  providers: []
})
export class EffortComponent implements OnInit {
	effort = {
		appId: "",
		weekId: "",
		noOfHours: 0,
		remarks: ""
	};
	note = {
		applicationName: "",
		message: ""
	};
	myApplications = [];
	weeks = [];
	constructor(private ajaxService: AjaxService, public utilities: Utilities) {
		
	}

	ngOnInit() {
		this.ajaxService.getApp()
	    .subscribe(
	      data => {
	        this.myApplications = data;
	      },
	      error => {

	      }
	    )

	    this.ajaxService.searchWeeks()
	    .subscribe(
	      data => {
	        if(data && data.length) {
	        	for(var i=0; i<data.length; i++) {
	        		let fDate = new Date(data[i].fromDate);
	        		let tDate = new Date(data[i].toDate);
	        		data[i].name = (fDate.getDate() + "/" + (fDate.getMonth() + 1) + "/" + fDate.getFullYear()) + " - " + (fDate.getDate() + "/" + (fDate.getMonth() + 1) + "/" + fDate.getFullYear());
	        	}
	        	this.weeks = data;
	        }
	      },
	      error => {

	      }
	    )
	}

	handleEffortFormSubmit(f: NgForm) {
		if(f.valid) {
			console.log(f.value);
			//this.ajaxService.addEffort()
		}
	}

	handleNoteFormSubmit() {
		
	}
}