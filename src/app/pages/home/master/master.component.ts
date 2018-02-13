import { Component, OnInit } from '@angular/core';
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {NgbDatepickerConfig, NgbDateStruct, NgbDateParserFormatter, NgbCalendar} from '@ng-bootstrap/ng-bootstrap';
import { AjaxService } from '../../../services/ajax.service';
import { Utilities } from '../../../services/utility.service';
import { NgForm } from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/merge';

const equals = (one: NgbDateStruct, two: NgbDateStruct) =>
  one && two && two.year === one.year && two.month === one.month && two.day === one.day;

const before = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two ? false : one.year === two.year ? one.month === two.month ? one.day === two.day
    ? false : one.day < two.day : one.month < two.month : one.year < two.year;

const after = (one: NgbDateStruct, two: NgbDateStruct) =>
  !one || !two ? false : one.year === two.year ? one.month === two.month ? one.day === two.day
    ? false : one.day > two.day : one.month > two.month : one.year > two.year;

@Component({
  selector: 'page-master',
  templateUrl: './master.html',
  providers: []
})

export class MasterComponent implements OnInit {
	private modalRef: NgbModalRef;
  public isAppError: boolean = false;
  public appErrorMsg: string = '';
  public isError: boolean = false;
  public errorMsg: string = '';
	hoveredDate: NgbDateStruct;
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;
  minDate: NgbDateStruct;
  app = {
  	appId: "",
  	emailId: ""
  };
  applications = [];
  public appsTableData;

  private sevenDays = 7 * 24 * 60 * 60 * 1000;
  showWeekErrMsg = false;

	constructor(private modalService: NgbModal, private ajaxService: AjaxService, public utilities: Utilities) {
		let today = new Date();
		this.minDate = {year: today.getFullYear(), month: today.getMonth()+1, day: today.getDate()};
	}

	openAppModal(appModal) {
		this.modalRef = this.modalService.open(appModal);
	}

	onDateChange(date: NgbDateStruct) {
	    if (!this.fromDate && !this.toDate) {
	      this.fromDate = date;
	    } else if (this.fromDate && !this.toDate && after(date, this.fromDate)) {
	      this.toDate = date;
	    } else {
	      this.toDate = null;
	      this.fromDate = date;
	    }

	    this.showWeekErrMsg = false;
	}

	isHovered = date => this.fromDate && !this.toDate && this.hoveredDate && after(date, this.fromDate) && before(date, this.hoveredDate);
  isInside = date => after(date, this.fromDate) && before(date, this.toDate);
  isFrom = date => equals(date, this.fromDate);
  isTo = date => equals(date, this.toDate);
  isLessThanToday = date => {
  	let _date = new Date();
  	let today = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate()).getTime();
  	let current = new Date(date.year, date.month-1, date.day).getTime();
  	return current < today;
  };

  addWeek() {
  	let fDate = new Date(this.fromDate.year, this.fromDate.month-1, this.fromDate.day).getTime();
  	let tDate = new Date(this.toDate.year, this.toDate.month-1, this.toDate.day).getTime();
    this.isError = false;
  	if((tDate - fDate) > this.sevenDays) {
  		this.showWeekErrMsg = true;
  	} else {
  		let week = {
  			fromDate: fDate,
  			toDate: tDate
  		};

      this.ajaxService.addWeek(week)
      .subscribe(
        data => {
          this.toDate = null;
          this.fromDate = null;
          this.utilities.alertMessage = "Week added successfully.";
          this.utilities.showAlertMsg = true;
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

  getApp() {
    this.ajaxService.getApp()
    .subscribe(
      data => {
        this.appsTableData = data;
        this.applications = data;
      },
      error => {

      }
    )
  }

  public ngOnInit():void {
    this.getApp();
  }

  handleNewAppFormSubmit(f: NgForm) {
    if(f.valid && typeof f.value.ownerEmailId == "object" ) {
       this.ajaxService.createApp(f.value.applicationName, f.value.ownerEmailId.emailId, f.value.description)
       .subscribe(
           data => {
            this.modalRef.close();
            this.utilities.alertMessage = "Application added successfully.";
            this.utilities.showAlertMsg = true;
            this.getApp();
            setTimeout(() => {
              this.utilities.showAlertMsg = false;
            }, 3000);
           },
           error => {
              this.isAppError = true;
              try {
                this.appErrorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime *";
              } catch (e) {
                this.appErrorMsg = "Something isn't right. Try after sometime *";
              }
           }
        )
    }
  }

  fetchUser = (text$: Observable<string>) =>
    text$
      .debounceTime(200)
      .distinctUntilChanged()
      .switchMap((term) => {
       if(term.length < 3) return Observable.of([]);
       else if(/@/.test(term) && /\..+/.test(term)){
         return this.ajaxService.searchUser({emailId: term})
                .catch(() => {
                  return Observable.of([]);
                });
       } else {
         return this.ajaxService.searchUser({name: term})
                .catch(() => {
                  return Observable.of([]);
                });
       }
      });

  userNameFormatter = (x: {name: string}) => { 
   return x.name; 
  };

  handleAssignUserFormSubmit(f: NgForm) {
    if(f.valid && typeof f.value.user == "object" ) {
      this.isError = false;
      this.ajaxService.assignUser(this.app.appId, f.value.user.emailId)
      .subscribe(
         data => {
          this.utilities.alertMessage = "User assigned successfully.";
          this.utilities.showAlertMsg = true;
          this.app = {
            appId: "",
            emailId: ""
          };
          setTimeout(() => {
            this.utilities.showAlertMsg = false;
          }, 3000);
         },
         error => {
            this.isError = true;
            try {
              this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime.";
            } catch (e) {
              this.errorMsg = "Something isn't right. Try after sometime.";
            }
         }
        )
    }
  }
}