import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gov-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gov-top-bar" role="region" aria-label="Official Government of India Utility Bar">
      <div class="gov-top-bar-container">
        
        <!-- Left: Official Republic of India Identity -->
        <div class="gov-identity-left">
          <span class="flag-icon" aria-hidden="true">🇮🇳</span>
          <span class="gov-text-primary">
            <span class="hindi-txt">भारत सरकार</span>
            <span class="sep">|</span>
            <span class="eng-txt">Government of India</span>
          </span>
          <span class="bullet" aria-hidden="true">•</span>
          <span class="dept-text">Digital Land Acquisition & Management Platform</span>
        </div>

        <!-- Right: Accessibility & Language Controls -->
        <div class="gov-controls-right">
          <a href="#main-content" class="gov-link skip-link">Skip to Main Content</a>
          <span class="divider" aria-hidden="true">|</span>

          <!-- Font Size Adjustment -->
          <div class="font-resizer-group" role="group" aria-label="Text size controls">
            <button 
              type="button" 
              class="resizer-btn" 
              [class.active]="currentFontSize === 'sm'"
              (click)="setFontSize('sm')" 
              title="Decrease Font Size (A-)"
              aria-label="Decrease text size">
              A-
            </button>
            <button 
              type="button" 
              class="resizer-btn" 
              [class.active]="currentFontSize === 'md'"
              (click)="setFontSize('md')" 
              title="Default Font Size (A)"
              aria-label="Reset text size to default">
              A
            </button>
            <button 
              type="button" 
              class="resizer-btn" 
              [class.active]="currentFontSize === 'lg'"
              (click)="setFontSize('lg')" 
              title="Increase Font Size (A+)"
              aria-label="Increase text size">
              A+
            </button>
          </div>

          <span class="divider" aria-hidden="true">|</span>

          <!-- Language Selector -->
          <div class="lang-toggle-group">
            <button 
              type="button" 
              class="lang-btn" 
              [class.active]="currentLanguage === 'en'"
              (click)="setLanguage('en')">
              English
            </button>
            <span class="slash">/</span>
            <button 
              type="button" 
              class="lang-btn" 
              [class.active]="currentLanguage === 'hi'"
              (click)="setLanguage('hi')">
              हिंदी
            </button>
          </div>

          <span class="divider" aria-hidden="true">|</span>
          <a href="#accessibility" class="gov-link accessibility-link">Accessibility</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .gov-top-bar {
      background-color: var(--color-gov-navy);
      color: #E2E8F0;
      font-size: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 0;
      line-height: 1.4;
    }

    .gov-top-bar-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .gov-identity-left {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .flag-icon {
      font-size: 0.875rem;
    }

    .gov-text-primary {
      color: #FFFFFF;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .hindi-txt {
      font-family: var(--font-family-hindi, 'Noto Sans Devanagari', sans-serif);
      font-weight: 600;
    }

    .eng-txt {
      font-weight: 600;
      color: #F8FAFC;
    }

    .sep {
      opacity: 0.5;
      margin: 0 2px;
    }

    .bullet {
      opacity: 0.4;
      margin: 0 2px;
    }

    .dept-text {
      color: #94A3B8;
      font-size: 0.6875rem;
    }

    .gov-controls-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .gov-link {
      color: #CBD5E1;
      text-decoration: none;
      font-size: 0.725rem;
      transition: color 0.15s;

      &:hover, &:focus {
        color: #FFFFFF;
        text-decoration: underline;
      }
    }

    .skip-link {
      font-weight: 500;
    }

    .divider {
      color: rgba(255, 255, 255, 0.2);
    }

    .font-resizer-group {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      padding: 1px 3px;
    }

    .resizer-btn {
      background: transparent;
      border: none;
      color: #CBD5E1;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 1px 5px;
      cursor: pointer;
      border-radius: 2px;
      line-height: 1.2;
      transition: all 0.15s;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #FFFFFF;
      }

      &.active {
        background: var(--color-saffron);
        color: #FFFFFF;
      }
    }

    .lang-toggle-group {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .lang-btn {
      background: transparent;
      border: none;
      color: #CBD5E1;
      font-size: 0.725rem;
      font-weight: 600;
      cursor: pointer;
      padding: 1px 4px;
      border-radius: 3px;
      transition: all 0.15s;

      &:hover {
        color: #FFFFFF;
      }

      &.active {
        color: #F59E0B;
        font-weight: 700;
      }
    }

    .slash {
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.65rem;
    }

    @media (max-width: 840px) {
      .dept-text {
        display: none;
      }
    }

    @media (max-width: 600px) {
      .gov-top-bar-container {
        justify-content: center;
      }
      .skip-link, .accessibility-link {
        display: none;
      }
    }
  `]
})
export class GovTopBarComponent {
  @Input() currentFontSize: 'sm' | 'md' | 'lg' = 'md';
  @Input() currentLanguage: 'en' | 'hi' = 'en';

  @Output() fontSizeChange = new EventEmitter<'sm' | 'md' | 'lg'>();
  @Output() languageChange = new EventEmitter<'en' | 'hi'>();

  setFontSize(size: 'sm' | 'md' | 'lg') {
    this.currentFontSize = size;
    this.fontSizeChange.emit(size);
  }

  setLanguage(lang: 'en' | 'hi') {
    this.currentLanguage = lang;
    this.languageChange.emit(lang);
  }
}
