import { Component, ElementRef, OnInit } from '@angular/core';
import {Router} from '@angular/router';

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
	clickedMap = {
		'dashboard': 'Dashboard',
		'effort': 'Fill Effort',
		'master': 'Master Data',
		'users': 'Manage Users'
	};

	constructor(private eRef: ElementRef, private router: Router) {
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
}