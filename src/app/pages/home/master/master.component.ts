import { Component, OnInit } from '@angular/core';
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {NgbDatepickerConfig, NgbDateStruct, NgbDateParserFormatter, NgbCalendar} from '@ng-bootstrap/ng-bootstrap';

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
	hoveredDate: NgbDateStruct;
    fromDate: NgbDateStruct;
    toDate: NgbDateStruct;
    minDate: NgbDateStruct;
    app = {
    	name: "",
    	user: ""
    };

    public appTableColumns: Array<any> = [
        {title: 'Name', name: 'name', filtering: {filterString: '', placeholder: 'Filter by name'}},
        {
          title: 'Position',
          name: 'position',
          sort: false,
          filtering: {filterString: '', placeholder: 'Filter by position'}
        },
        {title: 'Office', className: ['office-header', 'text-success'], name: 'office', sort: 'asc'},
        {title: 'Extn.', name: 'ext', sort: '', filtering: {filterString: '', placeholder: 'Filter by extn.'}},
        {title: 'Start date', className: 'text-warning', name: 'startDate'},
        {title: 'Salary ($)', name: 'salary'}
    ];

    appTable = {
        length: 1,
        page: 1,
        itemsPerPage: 10,
        maxSize: 5,
        numPages: 1,
        rows: [],
        columns: this.appTableColumns,
        data: [{name: "test", position: "desig", office: "gwl", ext: "90000", startDate: "21/11/22", salary: "30000"}],
        config: {
            paging: true,
            sorting: {columns: this.appTableColumns},
            filtering: {filterString: ''},
            className: ['table-striped', 'table-bordered']
        }
    };

    private sevenDays = 7 * 24 * 60 * 60 * 1000;
    showWeekErrMsg = false;

	constructor(private modalService: NgbModal) {
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
    	if((tDate - fDate) > this.sevenDays) {
    		this.showWeekErrMsg = true;
    	} else {
    		let week = {
    			fromDate: fDate,
    			toDate: tDate
    		};
    	}
    }

    
  

  public ngOnInit():void {
    this.onChangeTable(this.appTable.config);
  }

  public changePage(page:any, data:Array<any> = this.appTable.data):Array<any> {
    let start = (page.page - 1) * page.itemsPerPage;
    let end = page.itemsPerPage > -1 ? (start + page.itemsPerPage) : data.length;
    return data.slice(start, end);
  }

  public changeSort(data:any, config:any):any {
    if (!config.sorting) {
      return data;
    }

    let columns = this.appTable.config.sorting.columns || [];
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

  public changeFilter(data:any, config:any):any {
    let filteredData:Array<any> = data;
    this.appTable.columns.forEach((column:any) => {
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
        item[config.filtering.columnName].match(this.appTable.config.filtering.filterString));
    }

    let tempArray:Array<any> = [];
    filteredData.forEach((item:any) => {
      let flag = false;
      this.appTable.columns.forEach((column:any) => {
        if (item[column.name].toString().match(this.appTable.config.filtering.filterString)) {
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

  public onChangeTable(config:any, page:any = {page: this.appTable.page, itemsPerPage: this.appTable.itemsPerPage}):any {
    if (config.filtering) {
      Object.assign(this.appTable.config.filtering, config.filtering);
    }

    if (config.sorting) {
      Object.assign(this.appTable.config.sorting, config.sorting);
    }

    let filteredData = this.changeFilter(this.appTable.data, this.appTable.config);
    let sortedData = this.changeSort(filteredData, this.appTable.config);
    this.appTable.rows = page && config.paging ? this.changePage(page, sortedData) : sortedData;
    this.appTable.length = sortedData.length;
  }

  public onCellClick(data: any): any {
    console.log(data);
  }
}