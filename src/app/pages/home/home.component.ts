import { Component, ElementRef, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { Utilities } from '../../services/utility.service';
import { AjaxService } from '../../services/ajax.service';
import { NgForm, NgModel } from '@angular/forms';

@Component({
  selector: 'page-home',
  templateUrl: './home.html',
  providers: [Utilities, AjaxService],
  host: {
    '(document:click)': 'docClick($event)',
  }
})
export class HomeComponent implements OnInit {
	expanded = false;
	clicked = 'dashboard';
	private modalRef: NgbModalRef;
	public profile: any;
	public isError: boolean = false;
	public errorMsg: string = '';
	public isProfileError: boolean = false;
	public profileErrorMsg: string = '';

	clickedMap = {
		'dashboard': 'Dashboard',
		'effort': 'Fill Effort',
		'master': 'Master Data',
		'users': 'Manage Users'
	};

	constructor(private eRef: ElementRef, private router: Router, private modalService: NgbModal, public utilities: Utilities, private ajaxService: AjaxService) {
		document.body.classList.remove("login-bg");
	}

	ngOnInit() {
		this.profile = JSON.parse(this.utilities.getCookie("profile"));
		this.profile.image = localStorage.image;
		switch(this.router.url) {
			case '/home/dashboard':
				this.clicked = 'dashboard';
				break;
			case '/home/effort':
				this.clicked = 'effort';
				break;
			case '/home/master':
				this.clicked = 'master';
				break;
			case '/home/users':
				this.clicked = 'users';
		}
	}

	expandOrCollapse() {
		this.expanded = !this.expanded;
	}

	docClick(eve) {
		if(!document.getElementById("menu").contains(eve.target))
			this.expanded = false;
	}

	handleRoute(route) {
		this.router.navigate(["./home/" + route]);
		this.clicked = route;
		this.expanded = false;
	}

	handleSignOut() {
		this.router.navigate(["./login"]);
		this.ajaxService.logout();
		this.clicked = 'dashboard';
	}

	openProfileModal(profileModal) {
		this.isProfileError = false;
		this.modalRef = this.modalService.open(profileModal);
		this.expanded = false;
	}

	openChangePasswordModal(passMdl) {
		this.modalRef.close();
		this.modalRef = this.modalService.open(passMdl);
	}

	handleNewPasswordSubmit(f: NgForm) {
		if(f.valid) {
			let pwd = Object.assign({}, f.value);
			if(pwd.password.length < 4 || pwd.newPassword.length < 4 || pwd.confirmPassword.length < 4) {
				this.isError = true;
				this.errorMsg = "Password must be at least 4 characters long *";
			} else if (pwd.newPassword != pwd.confirmPassword) {
				this.isError = true;
				this.errorMsg = "Password do not match *";
			} else if(pwd.newPassword == pwd.password) {
				this.isError = true;
				this.errorMsg = "New Password and Old Password cannot be same *";
			} else {
				this.isError = false;
				this.errorMsg = '';
				//CALL CHANGE PASSWORD API
				this.ajaxService.changePassword(pwd.password, pwd.newPassword)
				.subscribe(
					data => {
						this.modalRef.close();
						this.utilities.alertMessage = "Password changed successfully.";
						this.utilities.showAlertMsg = true;
						setTimeout(() => {
							this.utilities.showAlertMsg = false;
						}, 3000);
					},
					error => {
						this.isError = true;
						this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime.";
					}
				)
			}
		}
	}

	changeProfilePhoto(e) {
		let self = this;
		if(e.target.files[0].size >= 200000) {
			this.profileErrorMsg = "Image size cannot be more than 200kb";
			this.isProfileError = true;
		} else {
			this.isProfileError = false;
			let reader = new FileReader();
            reader.onload = function (ev:any) {
                self.ajaxService.changeImage(ev.target.result)
                .subscribe(
                	data => {
                		self.profile.image = ev.target.result;
                		localStorage.image = ev.target.result;
                		self.utilities.setCookie("profile", JSON.stringify(self.profile));
                	},
                	error => {
                		self.isProfileError = true;
						self.profileErrorMsg = error.json() && error.json().message ? error.json().message : "Something isn't right. Try after sometime.";
                	}
                );
            };   
                reader.readAsDataURL(e.target.files[0]);
		}
	}
}