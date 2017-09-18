import { Component, ViewChild } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import {NgbDatepickerConfig, NgbDateStruct, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import { NgbDateLocalParserFormatter } from "../../../services/dateformat.service";
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'page-users',
  templateUrl: './users.html',
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateLocalParserFormatter}]
})
export class UsersComponent {
	designations = ["Software Engineer", "Senior Software Engineer", "Team Lead"];
	showEdit = false;
	opened = false;
	user = {
		name: '',
		emailId: '',
		dob: '',
		designation: '',
		isAdmin: false
	};
	private modalRef: NgbModalRef;

	constructor(dateConfig: NgbDatepickerConfig, private modalService: NgbModal) {
		let today = new Date();
		dateConfig.maxDate = {year: today.getFullYear(), month: today.getMonth()+1, day: today.getDate()};
	}

	handleNewUserFormSubmit(f: NgForm) {
		if(f.valid) {
			let user = Object.assign({}, f.value);
			user.dob = new Date(user.dob.year, user.dob.month-1, user.dob.day).getTime();
			//MAKE AJAX CALL TO ADD NEW USER
		};
	}

	handleSearchUpdateFormSubmit(f: NgForm) {
		if(f.valid) {
			this.showEdit = true;
		}
	}

	handleEditUserFormSubmit(f: NgForm) {
		if(f.valid) {

		}
	}

	handleSearchUserFormSubmit(f: NgForm) {
		//FETCH SEARCH RESULT
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
}