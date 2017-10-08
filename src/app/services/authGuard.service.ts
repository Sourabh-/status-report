import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Utilities } from './utility.service';
import { Router } from '@angular/router'

@Injectable()
export class AuthGuard implements CanActivate {
  
  constructor(public utilities: Utilities, private router: Router) {}

  canActivate() {
    if(this.utilities.getCookie("sessionId"))
    	return true;
    this.router.navigate(['/login']);
    return false
  }
}