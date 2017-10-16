import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormBuilder, Validators } from '@angular/forms';
import { NgbModal, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AjaxService } from '../../services/ajax.service';
import { Utilities } from '../../services/utility.service';

@Component({
  selector: 'page-login',
  templateUrl: './login.html',
  providers: [AjaxService, Utilities]
})
export class LoginComponent {
	public isProcessing:boolean = false;
	public isError:boolean = false;
	public isErrorInModal:boolean = false;
	public errorModalMsg:string = '';
	public errorMsg:string = '';
	public loginText:string = "Sign In"; 
	private modalRef: NgbModalRef;
	public loginForm = this.fb.group({
	    email: ["", Validators.compose([Validators.required])],
	    password: ["", Validators.compose([Validators.required, Validators.minLength(4)])]
	});

	constructor(private router: Router, public fb: FormBuilder, private ajaxService: AjaxService, public utilities: Utilities, private modalService: NgbModal) {
		if(!document.body.classList.contains("login-bg")) {
			document.body.classList.add("login-bg");
		}
	}

	handleSignIn(e) {
		if(this.loginForm.status == "VALID") {
			this.isError = true;
			this.errorMsg = '';
			this.beforeLogin();
			this.ajaxService.login(this.loginForm.value.email, this.loginForm.value.password)
			.subscribe(
				data => {
					this.afterLogin();
					this.utilities.setCookie("profile", JSON.stringify(data));
					this.router.navigate(['/home']);
				},
				error => {
					this.afterLogin();
					this.isError = true;
					this.errorMsg = error.json() && error.json().message ? (error.json().message + " *" ): "Something isn't right. Try after sometime.";
				}
			)
		}
	}

	beforeLogin() {
		this.isProcessing = true;
		this.loginText = "Please wait...";
	}

	afterLogin() {
		this.isProcessing = false;
		this.loginText = "Sign In";
	}

	handleForgotPasswordSubmit(f: NgForm) {
		if(f.valid) {
			this.isErrorInModal = false;
			console.log("HERE12");
			this.ajaxService.forgotPassword(f.value.emailId)
			.subscribe(
				data => {
					console.log("HERE");
					this.modalRef.close();
					this.utilities.alertMessage = "New password sent to your emailId.";
					this.utilities.showAlertMsg = true;
					setTimeout(() => {
						this.utilities.showAlertMsg = false;
					}, 3000);
				},
				error => {
					this.isErrorInModal = true;
					try {
						this.errorModalMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime.";
					} catch (e) {
						this.errorModalMsg = "Something isn't right. Try after sometime.";
					}
				}
			)
		}
	}

	openForgotPasswordModal(passMdl) {
		this.isErrorInModal = true;
		this.errorModalMsg = '';
		this.modalRef = this.modalService.open(passMdl);
	}
}