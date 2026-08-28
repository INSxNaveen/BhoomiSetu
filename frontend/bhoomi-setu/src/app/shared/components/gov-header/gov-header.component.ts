import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-gov-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="gov-main-header" role="banner">
      <div class="gov-header-container">
        
        <!-- Brand & National Emblem -->
        <div class="gov-brand-block" (click)="navigateHome()" tabindex="0" (keydown.enter)="navigateHome()" role="button" aria-label="BhoomiSetu Home">
          <div class="emblem-container" aria-hidden="true">
            <!-- Official Emblem SVG / Stylized Government Seal -->
            <div class="emblem-seal">
              <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" stroke="#0B2545" stroke-width="3" fill="#F8FAFC"/>
                <circle cx="50" cy="50" r="38" stroke="#D97706" stroke-width="1.5" stroke-dasharray="4 2"/>
                <path d="M50 20 L53 32 L65 32 L56 40 L59 52 L50 44 L41 52 L44 40 L35 32 L47 32 Z" fill="#0B2545"/>
                <path d="M30 60 Q50 48 70 60 L68 76 Q50 70 32 76 Z" fill="#163A70"/>
                <circle cx="50" cy="62" r="6" stroke="#D97706" stroke-width="1.5" fill="#FFFFFF"/>
                <text x="50" y="90" font-family="'Noto Sans Devanagari', sans-serif" font-size="9" font-weight="700" fill="#0B2545" text-anchor="middle">सत्यमेव जयते</text>
              </svg>
            </div>
          </div>

          <div class="brand-text">
            <div class="brand-hindi">भूमि सेतु</div>
            <div class="brand-english">
              <span class="brand-title">BhoomiSetu</span>
              <span class="brand-badge">GOI-DPI</span>
            </div>
            <div class="brand-tagline">National Land Acquisition & Management System</div>
          </div>
        </div>

        <!-- Desktop Navigation Links -->
        <nav class="gov-nav-menu" role="navigation" aria-label="Main Navigation">
          <a href="#hero" class="nav-item" [class.active]="activeSection === 'home'">Home</a>
          <a href="#about" class="nav-item">About BhoomiSetu</a>
          <a href="#how-it-works" class="nav-item">How It Works</a>
          <a href="#services" class="nav-item">Services</a>
          <a href="#citizen-inquiry" class="nav-item citizen-highlight">
            <span class="icon">🔍</span> Citizen Services
          </a>
          <a href="#help" class="nav-item">Help</a>
        </nav>

        <!-- Right Header Action CTAs -->
        <div class="gov-header-actions">
          <button type="button" class="btn-gov-secondary" (click)="navigateToCitizen()">
            <span class="btn-icon">🌾</span>
            <span>Citizen Portal</span>
          </button>

          <button type="button" class="btn-gov-primary" (click)="navigateToLogin()">
            <span class="btn-icon">🔐</span>
            <span>Official Sign In</span>
          </button>

          <!-- Mobile Menu Hamburger -->
          <button 
            type="button" 
            class="mobile-menu-toggle" 
            (click)="toggleMobileMenu()" 
            [attr.aria-expanded]="mobileMenuOpen"
            aria-label="Toggle Navigation Menu">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </button>
        </div>

      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-nav-drawer" [class.open]="mobileMenuOpen" *ngIf="mobileMenuOpen">
        <nav class="mobile-links">
          <a href="#hero" (click)="closeMobileMenu()">Home</a>
          <a href="#about" (click)="closeMobileMenu()">About BhoomiSetu</a>
          <a href="#how-it-works" (click)="closeMobileMenu()">How It Works</a>
          <a href="#services" (click)="closeMobileMenu()">Core Services</a>
          <a href="#citizen-inquiry" (click)="closeMobileMenu()">Citizen Land Status</a>
          <a href="#roles" (click)="closeMobileMenu()">Stakeholder Portals</a>
          <a href="#national-stats" (click)="closeMobileMenu()">National Monitoring</a>
          <a href="#notices" (click)="closeMobileMenu()">Notices & Circulars</a>
          <a href="#help" (click)="closeMobileMenu()">Citizen Help & FAQ</a>
          <div class="mobile-cta-group">
            <button type="button" class="btn-gov-secondary full-w" (click)="navigateToCitizen(); closeMobileMenu()">Citizen Portal</button>
            <button type="button" class="btn-gov-primary full-w" (click)="navigateToLogin(); closeMobileMenu()">Official Sign In</button>
          </div>
        </nav>
      </div>

      <!-- Official Tricolor Accent Strip -->
      <div class="tricolor-strip" aria-hidden="true">
        <div class="stripe saffron"></div>
        <div class="stripe white"></div>
        <div class="stripe green"></div>
      </div>
    </header>
  `,
  styles: [`
    .gov-main-header {
      background-color: #FFFFFF;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 6px rgba(11, 37, 69, 0.05);
    }

    .gov-header-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .gov-brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      user-select: none;
      text-decoration: none;
    }

    .emblem-container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-hindi {
      font-family: var(--font-family-hindi, 'Noto Sans Devanagari', sans-serif);
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-saffron);
      line-height: 1.1;
      letter-spacing: 0.5px;
    }

    .brand-english {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--color-gov-navy);
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    .brand-badge {
      background-color: #EFF6FF;
      color: var(--color-primary-blue);
      border: 1px solid #BFDBFE;
      font-size: 0.625rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .brand-tagline {
      font-size: 0.725rem;
      color: var(--color-text-secondary);
      font-weight: 500;
      line-height: 1.2;
      margin-top: 2px;
    }

    .gov-nav-menu {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .nav-item {
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      &:hover {
        background-color: #F1F5F9;
        color: var(--color-primary-blue);
      }

      &.citizen-highlight {
        color: var(--color-primary-blue);
        background-color: #EFF6FF;
        border: 1px solid #DBEAFE;

        &:hover {
          background-color: #DBEAFE;
        }
      }
    }

    .gov-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-gov-primary {
      background-color: var(--color-gov-navy);
      color: #FFFFFF;
      border: 1px solid #061528;
      padding: 8px 16px;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(11, 37, 69, 0.1);

      &:hover {
        background-color: #12345A;
        transform: translateY(-1px);
        box-shadow: 0 3px 6px rgba(11, 37, 69, 0.15);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .btn-gov-secondary {
      background-color: #FFFFFF;
      color: var(--color-gov-navy);
      border: 1px solid var(--color-border);
      padding: 8px 14px;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;

      &:hover {
        background-color: #F8FAFC;
        border-color: #CBD5E1;
        color: var(--color-primary-blue);
      }
    }

    .btn-icon {
      font-size: 0.95rem;
    }

    .mobile-menu-toggle {
      display: none;
      background: none;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 6px 8px;
      cursor: pointer;
      flex-direction: column;
      gap: 4px;

      .bar {
        width: 20px;
        height: 2px;
        background-color: var(--color-gov-navy);
        border-radius: 1px;
      }
    }

    .mobile-nav-drawer {
      display: none;
      background-color: #FFFFFF;
      border-bottom: 1px solid var(--color-border);
      padding: 16px 20px;

      .mobile-links {
        display: flex;
        flex-direction: column;
        gap: 10px;

        a {
          color: var(--color-text-primary);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 0;
          border-bottom: 1px solid #F1F5F9;
        }
      }

      .mobile-cta-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
      }

      .full-w {
        width: 100%;
        justify-content: center;
      }
    }

    .tricolor-strip {
      height: 3px;
      display: flex;
      width: 100%;

      .stripe {
        flex: 1;
        &.saffron { background-color: #FF9933; }
        &.white { background-color: #FFFFFF; }
        &.green { background-color: #138808; }
      }
    }

    @media (max-width: 1080px) {
      .gov-nav-menu {
        display: none;
      }

      .mobile-menu-toggle {
        display: flex;
      }

      .mobile-nav-drawer {
        display: block;
      }
    }

    @media (max-width: 640px) {
      .brand-tagline {
        display: none;
      }
      .btn-gov-secondary {
        display: none;
      }
    }
  `]
})
export class GovHeaderComponent {
  private router = inject(Router);

  @Input() activeSection: string = 'home';
  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  navigateHome() {
    this.router.navigate(['/']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToCitizen() {
    const el = document.getElementById('citizen-inquiry');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/login']);
    }
  }
}
