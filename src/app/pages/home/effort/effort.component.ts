import { Component } from '@angular/core';

@Component({
  selector: 'page-effort',
  templateUrl: './effort.html',
  providers: []
})
export class EffortComponent {
	effort = {
		applicationName: "",
		week: "",
		hours: 0
	};

	constructor() {
		
	}

	handleEffortFormSubmit() {

	}

	handleNoteFormSubmit() {
		
	}
}