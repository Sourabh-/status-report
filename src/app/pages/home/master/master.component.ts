import { Component } from '@angular/core';
import {NgbModal, ModalDismissReasons, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'page-master',
  templateUrl: './master.html',
  providers: []
})
export class MasterComponent {
	private modalRef: NgbModalRef;
	constructor(private modalService: NgbModal) {
		
	}

	openAppModal(appModal) {
		this.modalRef = this.modalService.open(appModal);
	}
}