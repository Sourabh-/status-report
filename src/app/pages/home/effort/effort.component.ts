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
		appId: "",
		message: ""
	};
	myApplications = [];
	weeks = [];
	public isError: boolean = false;
	public errorMsg: string = '';
	constructor(private ajaxService: AjaxService, public utilities: Utilities) {
		
	}

	ngOnInit() {
		this.ajaxService.getApp({
			assigneeEmailId: JSON.parse(this.utilities.getCookie("profile")).emailId
		})
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
			this.isError = false;
			this.ajaxService.addEffort(f.value)
			.subscribe(
				data => {
		            this.utilities.alertMessage = "Thanks! Your effort is added successfully.";
		            this.utilities.showAlertMsg = true;
		            this.effort = {
						appId: "",
						weekId: "",
						noOfHours: 0,
						remarks: ""
					};
		            setTimeout(() => {
		              this.utilities.showAlertMsg = false;
		            }, 3000);
				},
				error => {
				  this.isError = true;
	              try {
	                this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime *";
	              } catch (e) {
	                this.errorMsg = "Something isn't right. Try after sometime *";
	              }
				}
			)
		}
	}

	handleNoteFormSubmit(f: NgForm) {
		if(f.valid) {
			this.isError = false;
			var ownerEmailId = '';
			for(var i=0; i<this.myApplications.length; i++) {
				if(f.value.appId == this.myApplications[i].appId) {
					ownerEmailId = this.myApplications[i].ownerEmailId;
					break;
				}
			}

			this.ajaxService.noteToOwner(f.value.appId, f.value.message, ownerEmailId)
			.subscribe(
				data => {
					this.utilities.alertMessage = "Thanks for your valuable notes! Your message is sent successfully.";
		            this.utilities.showAlertMsg = true;
					this.note = {
						appId: "",
						message: ""
					};
					setTimeout(() => {
		              this.utilities.showAlertMsg = false;
		            }, 3000);
				},
				error => {
				    this.isError = true;
	                try {
	                  this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime *";
	                } catch (e) {
	                  this.errorMsg = "Something isn't right. Try after sometime *";
	                }
				}
			)
		}
	}
}