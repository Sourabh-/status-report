import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Observable';
import { Http, Response, Request, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Utilities } from './utility.service';

@Injectable()
export class AjaxService {
	constructor(private http: Http, private utilities: Utilities) {}

	login(emailId, password) {
		let requestOptions = new RequestOptions({
            method: 'POST',
            url: '/account/session/create',
            headers: new Headers({"Content-Type": "application/json"}),
            body: {
            	emailId: emailId,
            	password: password
            }
        });
		return this.http.request(new Request(requestOptions))
		.map((res: Response) => res.json())
	}

    logout() {
        localStorage.clear();
        sessionStorage.clear();
        this.utilities.setCookie('profile', '', 0);
        this.utilities.setCookie('sessionId', '', 0);
        let requestOptions = new RequestOptions({
            method: 'DELETE',
            url: '/account/session/destroy'
        });
        return this.http.request(new Request(requestOptions))
        .map((res: Response) => {})
        .subscribe();
    }

    changePassword(password, newPassord) {
        let requestOptions = new RequestOptions({
            method: 'POST',
            url: '/account/password/update',
            headers: new Headers({"Content-Type": "application/json"}),
            body: {
                newPassword: newPassord,
                password: password
            }
        });
        return this.http.request(new Request(requestOptions))
        .map((res: Response) => res.json())
    }

    forgotPassword(emailId) {
        let requestOptions = new RequestOptions({
            method: 'POST',
            url: '/account/password/forgot',
            headers: new Headers({"Content-Type": "application/json"}),
            body: {
                emailId: emailId,
            }
        });
        return this.http.request(new Request(requestOptions))
        .map((res: Response) => res.json())
    }

    addUser(user) {
        let requestOptions = new RequestOptions({
            method: 'POST',
            url: '/users/create',
            headers: new Headers({"Content-Type": "application/json"}),
            body: user
        });
        return this.http.request(new Request(requestOptions))
        .map((res: Response) => res.json())
    }

    searchUser(user) {
        let params = new URLSearchParams();
        for (var key in user) {
            params.set(key, user[key]);
        }

        let requestOptions = new RequestOptions({
            method: 'GET',
            url: '/users/search',
            headers: new Headers({"Content-Type": "application/json"}),
            params: params
        });
        return this.http.request(new Request(requestOptions))
        .map((res: Response) => res.json())   
    }

    updateUser(emailId, user) {
        let requestOptions = new RequestOptions({
            method: 'PUT',
            url: '/users/update/' + encodeURIComponent(emailId),
            headers: new Headers({"Content-Type": "application/json"}),
            body: user
        });
        return this.http.request(new Request(requestOptions))
        .map((res: Response) => res.json())
    }
}
