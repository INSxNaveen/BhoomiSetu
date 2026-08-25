import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusText',
  standalone: true
})
export class StatusPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.replace(/([A-Z])/g, ' $1').trim();
  }
}

export enum ApplicationStatusEnum {
  Draft = 'Draft',
  Submitted = 'Submitted',
  DistrictVerification = 'DistrictVerification',
  StateReview = 'StateReview',
  Approved = 'Approved',
  Rejected = 'Rejected'
}
