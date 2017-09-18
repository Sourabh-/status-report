import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'page-login',
  templateUrl: './login.html',
  providers: []
})
export class LoginComponent {
	public loginForm = this.fb.group({
	    email: ["", Validators.compose([Validators.required])],
	    password: ["", Validators.compose([Validators.required, Validators.minLength(4)])]
	});

	constructor(private router: Router, public fb: FormBuilder) {
		if(!document.body.classList.contains("login-bg")) {
			document.body.classList.add("login-bg");
		}
	}

	handleSignIn(e) {
		/*if(this.loginForm.status == "VALID") {

		}*/

		this.router.navigate(["./home"]);
	}
}