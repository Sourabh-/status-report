import { Component, ElementRef, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'page-home',
  templateUrl: './home.html',
  providers: [],
  host: {
    '(document:click)': 'docClick($event)',
  }
})
export class HomeComponent implements OnInit {
	expanded = false;
	clicked = 'dashboard';
	private modalRef: NgbModalRef;
	clickedMap = {
		'dashboard': 'Dashboard',
		'effort': 'Fill Effort',
		'master': 'Master Data',
		'users': 'Manage Users'
	};

	constructor(private eRef: ElementRef, private router: Router, private modalService: NgbModal) {
		document.body.classList.remove("login-bg");
	}

	ngOnInit() {
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
		this.clicked = 'dashboard';
	}

	openProfileModal(profileModal) {
		this.modalRef = this.modalService.open(profileModal);
	}

	openChangePasswordModal(passMdl) {
		this.modalRef.close();
		this.modalRef = this.modalService.open(passMdl);
	}
}