import { Component, ViewChild, OnInit } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import {NgbDatepickerConfig, NgbDateStruct, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import { NgbDateLocalParserFormatter } from "../../../services/dateformat.service";
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { AjaxService } from '../../../services/ajax.service';
import { Utilities } from '../../../services/utility.service';
import { designations } from "../../../data/data";

@Component({
  selector: 'page-users',
  templateUrl: './users.html',
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateLocalParserFormatter}]
})
export class UsersComponent implements OnInit {
	designations = designations;
	isAdmin = JSON.parse(this.utilities.getCookie("profile")).isAdmin;
	showEdit = false;
	public isSearchResult: boolean = false;
	public isUserError: boolean = false;
    public userErrorMsg: string = '';
	public users;
	opened = false;
	user = {
		name: '',
		emailId: '',
		dob: '',
		designation: '',
		isAdmin: false
	};
	private modalRef: NgbModalRef;
	public isError: boolean = false;
	public errorMsg: string = '';
	public deleteUserObject;

	constructor(dateConfig: NgbDatepickerConfig, private modalService: NgbModal, private ajaxService: AjaxService, private utilities: Utilities) {
		let today = new Date();
		dateConfig.minDate = {year: 1950, month: 1, day: 1};
		dateConfig.maxDate = {year: today.getFullYear(), month: today.getMonth()+1, day: today.getDate()};
	}

	public ngOnInit():void {
		this.handleSearchUserFormSubmit();
	}

	handleNewUserFormSubmit(f: NgForm) {
		if(f.valid) {
			let user = Object.assign({}, f.value);
			this.isError = false;
			user.dob = new Date(user.dob.year, user.dob.month-1, user.dob.day).getTime();
			//MAKE AJAX CALL TO ADD NEW USER
			this.ajaxService.addUser(user)
			.subscribe(
				data => {
					this.user = {
						name: '',
						emailId: '',
						dob: '',
						designation: '',
						isAdmin: false
					};
					this.utilities.alertMessage = "User added successfully.";
					this.utilities.showAlertMsg = true;
					setTimeout(() => {
						this.utilities.showAlertMsg = false;
					}, 3000);
				},
				error => {
					this.isError = true;
					this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime *";
				}
			)
		};
	}

	handleSearchUpdateFormSubmit(f: NgForm) {
		if(f.valid) {
			this.ajaxService.searchUser({emailId: f.value.searchEmailId})
			.subscribe(
				data => {
					if(data && data.length) {
						var bDate = new Date(data[0].dob);
						data[0].dob = {
							day: bDate.getDate(), 
							month: bDate.getMonth()+1, 
							year: bDate.getFullYear()
						};

						this.user = data[0];
						this.showEdit = true;
					} else {

					}
				},
				error => {
					this.isError = true;
					this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime *";
				}
			)
		}
	}

	handleEditUserFormSubmit(f: NgForm) {
		if(f.valid) {
			this.isError = false;
			if(f.value.dob) f.value.dob = new Date(f.value.dob.year, f.value.dob.month-1, f.value.dob.day).getTime();
			this.ajaxService.updateUser(this.user.emailId, f.value)
			.subscribe(
				data => {
					this.user = {
						name: '',
						emailId: '',
						dob: '',
						designation: '',
						isAdmin: false
					};
					this.utilities.alertMessage = "User updated successfully.";
					this.utilities.showAlertMsg = true;
					this.showEdit = false;
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

	handleSearchUserFormSubmit(f?: NgForm) {
		//FETCH SEARCH RESULT
		if(f && ((f.value.emailId && f.controls.emailId.invalid) ||
			(f.value.dob && f.controls.dob.invalid))) return; 
		if(f && f.value.dob) f.value.dob = new Date(f.value.dob.year, f.value.dob.month-1, f.value.dob.day).getTime();
		var user = {}; 
		if(f)
			for(var key in f.value)
				if(f.value[key])
					user[key] = f.value[key];

		this.ajaxService.searchUser(user)
		.subscribe(
			data => {
				if(data && data.length) {
					this.users = data;
					this.isSearchResult = true;
				} else {
					this.users = [];
					this.isSearchResult = false;
					this.utilities.showAlertMsg = true;
					this.utilities.alertMessage = "No search results!";
					setTimeout(() => {
						this.utilities.showAlertMsg = false;
					}, 3000);
				}
				
			},
			error => {
				this.isError = true;
				this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime *";
			}
		)
	}

	confirmAdminPopup(checked, confirm) {
		let self = this;
		if(checked == true && !this.opened) {
			document.getElementById("isAdmin").blur();
			self.opened = true;
    		self.modalRef = self.modalService.open(confirm);
		}
	}

	resetAdmin() {
		this.user.isAdmin = false;
		this.modalRef.close();
	}

	openDeleteUserModal(user, deleteUser) {
		this.deleteUserObject = user;
		this.modalRef = this.modalService.open(deleteUser);
	}

	deleteSelectedUser() {
		this.ajaxService.deleteUser(this.deleteUserObject.emailId)
		.subscribe(
			data => {
				this.utilities.alertMessage = "User deleted successfully.";
				this.utilities.showAlertMsg = true;
				this.handleSearchUserFormSubmit();
				setTimeout(() => {
					this.utilities.showAlertMsg = false;
				}, 3000);
			},
			error => {
				this.isUserError = true;
				this.userErrorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime *";
			}
		)
	}
}