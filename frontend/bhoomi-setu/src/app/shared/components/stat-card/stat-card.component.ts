import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bs-stat-card" [ngClass]="'bs-stat-' + (variant || 'blue')">
      <div class="bs-stat-top">
        <span class="bs-stat-label">{{ title }}</span>
        <span class="bs-stat-icon" *ngIf="icon">{{ icon }}</span>
      </div>
      <div class="bs-stat-value">
        {{ value }}
        <span class="unit" *ngIf="unit">{{ unit }}</span>
      </div>
      <div class="bs-stat-subtext" *ngIf="subtext" [ngClass]="subtextClass">
        {{ subtext }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() unit: string = '';
  @Input() subtext: string = '';
  @Input() subtextClass: string = '';
  @Input() icon: string = '';
  @Input() variant: 'blue' | 'green' | 'amber' | 'saffron' | 'red' | 'navy' = 'blue';
}
