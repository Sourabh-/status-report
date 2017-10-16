import { Component, ViewChild } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import {NgbDatepickerConfig, NgbDateStruct, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import { NgbDateLocalParserFormatter } from "../../../services/dateformat.service";
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { AjaxService } from '../../../services/ajax.service';
import { Utilities } from '../../../services/utility.service';

@Component({
  selector: 'page-users',
  templateUrl: './users.html',
  providers: [{provide: NgbDateParserFormatter, useClass: NgbDateLocalParserFormatter}]
})
export class UsersComponent {
	designations = [
		"Software Engineer", 
		"Senior Software Engineer", 
		"Team Lead",
		"Lead Consultant",
		"Director",
		"Chief Technical Officer",
		"Architect",
		"Associate Architect",
		"Chief Architect",
		"Chief Executive Officer",
		"Manager",
		"Technical Manager",
		"Project Manager",
		"Delivery Manager",
		"Assistant Vice President",
		"Vice President"
		];
	showEdit = false;
	public isSearchResult: boolean = false;
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
	public userTableColumns: Array<any> = [
        {
        	title: 'Name', 
        	name: 'name', 
        	filtering: {filterString: '', placeholder: 'Filter by name'}
        },
        {
	        title: 'Email Id',
	        name: 'emailId',
	        sort: false,
	        filtering: {filterString: '', placeholder: 'Filter by email'}
        },
        {
        	title: 'Designation', 
        	name: 'designation'
        },
        {
        	title: 'Is Admin ?', 
        	name: 'isAdmin'
        }
    ];

    userTable = {
        length: 1,
        page: 1,
        itemsPerPage: 1,
        maxSize: 5,
        numPages: 1,
        rows: [],
        data: [],
        columns: this.userTableColumns,
        config: {
            paging: true,
            sorting: {columns: this.userTableColumns},
            filtering: {filterString: ''},
            className: ['table-striped', 'table-bordered']
        }
    };

	constructor(dateConfig: NgbDatepickerConfig, private modalService: NgbModal, private ajaxService: AjaxService, private utilities: Utilities) {
		let today = new Date();
		dateConfig.maxDate = {year: today.getFullYear(), month: today.getMonth()+1, day: today.getDate()};
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
					this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime.";
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
					this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime.";
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
						this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime.";
					} catch (e) {
						this.errorMsg = "Something isn't right. Try after sometime.";
					}
				}
			)
		}
	}

	handleSearchUserFormSubmit(f: NgForm) {
		//FETCH SEARCH RESULT
		if((f.value.emailId && f.controls.emailId.invalid) ||
			(f.value.dob && f.controls.dob.invalid)) return; 
		if(f.value.dob) f.value.dob = new Date(f.value.dob.year, f.value.dob.month-1, f.value.dob.day).getTime();
		var user = {}; 
		for(var key in f.value)
			if(f.value[key])
				user[key] = f.value[key];

		this.ajaxService.searchUser(user)
		.subscribe(
			data => {
				if(data && data.length) {
					this.userTable.data = data;
					this.isSearchResult = true;
					this.onChangeTable(this.userTable.config, {page: this.userTable.page, itemsPerPage: 1}, "userTable");
				} else {
					this.userTable.data = [];
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
				this.errorMsg = error.json() && error.json().message ? (error.json().message + " *") : "Something isn't right. Try after sometime.";
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

	//TABLE STUFF ===========================================================================>>
	public changePage(page:any, data:Array<any> = []):Array<any> {
	    let start = (page.page - 1) * page.itemsPerPage;
	    let end = page.itemsPerPage > -1 ? (start + page.itemsPerPage) : data.length;
	    return data.slice(start, end);
	}

	public changeSort(data:any, config:any, tableName):any {
	    if (!config.sorting) {
	      return data;
	    }

	    let columns = this[tableName].config.sorting.columns || [];
	    let columnName:string = void 0;
	    let sort:string = void 0;

	    for (let i = 0; i < columns.length; i++) {
	      if (columns[i].sort !== '' && columns[i].sort !== false) {
	        columnName = columns[i].name;
	        sort = columns[i].sort;
	      }
	    }

	    if (!columnName) {
	      return data;
	    }

	    // simple sorting
	    return data.sort((previous:any, current:any) => {
	      if (previous[columnName] > current[columnName]) {
	        return sort === 'desc' ? -1 : 1;
	      } else if (previous[columnName] < current[columnName]) {
	        return sort === 'asc' ? -1 : 1;
	      }
	      return 0;
	    });
	}

	public changeFilter(data:any, config:any, tableName):any {
	    let filteredData:Array<any> = data;
	    this[tableName].columns.forEach((column:any) => {
	      if (column.filtering) {
	        filteredData = filteredData.filter((item:any) => {
	          return item[column.name].match(column.filtering.filterString);
	        });
	      }
	    });

	    if (!config.filtering) {
	      return filteredData;
	    }

	    if (config.filtering.columnName) {
	      return filteredData.filter((item:any) =>
	        item[config.filtering.columnName].match(this[tableName].config.filtering.filterString));
	    }

	    let tempArray:Array<any> = [];
	    filteredData.forEach((item:any) => {
	      let flag = false;
	      this[tableName].columns.forEach((column:any) => {
	        if (item[column.name].toString().match(this[tableName].config.filtering.filterString)) {
	          flag = true;
	        }
	      });
	      if (flag) {
	        tempArray.push(item);
	      }
	    });
	    filteredData = tempArray;

	    return filteredData;
	}

	public onChangeTable(config:any, page, tableName):any {
	    if (config.filtering) {
	      Object.assign(this[tableName].config.filtering, config.filtering);
	    }

	    if (config.sorting) {
	      Object.assign(this[tableName].config.sorting, config.sorting);
	    }

	    let filteredData = this.changeFilter(this[tableName].data, this[tableName].config, tableName);
	    let sortedData = this.changeSort(filteredData, this[tableName].config, tableName);
	    this[tableName].rows = page && config.paging ? this.changePage(page, sortedData) : sortedData;
	    this[tableName].length = sortedData.length;
	  }

	  public onCellClick(data: any): any {
	    console.log(data);
	}
	//=======================================================================================>>
}