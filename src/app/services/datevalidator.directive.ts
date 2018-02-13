import { AbstractControl, ValidatorFn, NG_VALIDATORS, Validator, FormControl } from '@angular/forms';
import { Directive } from '@angular/core';

function validateDateFactory() : ValidatorFn {
  return (frm: AbstractControl) => {
    let isValid = frm.value ? frm.value.day && frm.value.month && frm.value.year && (frm.value.year + "").length == 4 : true;
    if(isValid) {
        return null;
    } else {
        return {
            datevalidator: {
                valid: false
            }
        };
    }
  }
}

@Directive({
  selector: '[datevalidator][ngModel]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: DateValidatorDirective, multi: true }
  ]
})

export class DateValidatorDirective implements Validator {
  validator: ValidatorFn;
  
  constructor() {
    this.validator = validateDateFactory();
  }
  
  validate(frm: FormControl) {
    return this.validator(frm);
  }
  
}