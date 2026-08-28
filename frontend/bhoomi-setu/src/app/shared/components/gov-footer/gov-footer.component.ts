import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-gov-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="gov-footer" role="contentinfo" aria-label="Official Government Portal Footer">
      
      <!-- Top Government Portals Strip -->
      <div class="footer-initiatives-strip">
        <div class="footer-container">
          <div class="initiatives-grid">
            <div class="initiative-item">
              <span class="init-badge">PM GATISHAKTI</span>
              <span class="init-title">National Master Plan for Multi-Modal Connectivity</span>
            </div>
            <div class="initiative-item">
              <span class="init-badge">DoLR</span>
              <span class="init-title">Department of Land Resources &bull; MoRD</span>
            </div>
            <div class="initiative-item">
              <span class="init-badge">DIGITAL INDIA</span>
              <span class="init-title">National Digital Public Infrastructure (DPI)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Footer Columns -->
      <div class="footer-main-section">
        <div class="footer-container">
          <div class="footer-columns-grid">
            
            <!-- Column 1: BhoomiSetu Overview -->
            <div class="footer-col brand-col">
              <div class="footer-brand-title">
                <span class="hindi-text">भूमि सेतु</span>
                <span class="eng-text">BhoomiSetu</span>
              </div>
              <p class="footer-desc">
                National Land Acquisition & Management Platform uniting project authorities, district collectorates, state governments, central ministries and citizens under a single transparent digital lifecycle.
              </p>
              <div class="statutory-note">
                <strong>Statutory Framework:</strong> RFCTLARR Act 2013, National Land Records Modernization Programme (NLRMP), and PM GatiShakti Guidelines.
              </div>
            </div>

            <!-- Column 2: Platform Links -->
            <div class="footer-col">
              <h4 class="col-heading">BhoomiSetu Portal</h4>
              <ul class="footer-links-list">
                <li><a href="#hero">Portal Home</a></li>
                <li><a href="#about">About Platform</a></li>
                <li><a href="#how-it-works">7-Stage Acquisition Lifecycle</a></li>
                <li><a href="#services">Core Modules & Services</a></li>
                <li><a href="#roles">Stakeholder Roles & Matrix</a></li>
                <li><a href="#national-stats">National Platform Monitoring</a></li>
              </ul>
            </div>

            <!-- Column 3: Citizen Services -->
            <div class="footer-col">
              <h4 class="col-heading">Citizen Services</h4>
              <ul class="footer-links-list">
                <li><a href="#citizen-inquiry">Check Land Status (Survey/Khasra)</a></li>
                <li><a href="#solatium-calculator">RFCTLARR 2013 Compensation Calculator</a></li>
                <li><a href="#gis-preview">National GIS Land Map</a></li>
                <li><a href="#notices">Statutory Notices (Sec 4 / 11 / 19)</a></li>
                <li><a href="#help">Citizen Grievance & CPGRAMS Helpdesk</a></li>
                <li><a (click)="navigateToLogin()" style="cursor: pointer;">Citizen Dashboard Access</a></li>
              </ul>
            </div>

            <!-- Column 4: Official Government Links -->
            <div class="footer-col">
              <h4 class="col-heading">Official Portals</h4>
              <ul class="footer-links-list">
                <li><a href="https://india.gov.in" target="_blank" rel="noopener noreferrer">National Portal of India (india.gov.in) ↗</a></li>
                <li><a href="https://rural.gov.in" target="_blank" rel="noopener noreferrer">Ministry of Rural Development ↗</a></li>
                <li><a href="https://morth.nic.in" target="_blank" rel="noopener noreferrer">Ministry of Road Transport & Highways ↗</a></li>
                <li><a href="https://indianrailways.gov.in" target="_blank" rel="noopener noreferrer">Ministry of Railways ↗</a></li>
                <li><a href="https://digitalindia.gov.in" target="_blank" rel="noopener noreferrer">Digital India Portal ↗</a></li>
                <li><a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer">CPGRAMS Citizen Grievances ↗</a></li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      <!-- Bottom Compliance & Copyright Bar -->
      <div class="footer-bottom-bar">
        <div class="footer-container bottom-flex">
          <div class="copyright-text">
            © 2026 <strong>BhoomiSetu</strong> &bull; National Land Acquisition & Management System. All Rights Reserved.
          </div>
          
          <div class="compliance-links">
            <a href="#help">Privacy Policy</a>
            <span class="dot">&bull;</span>
            <a href="#help">Terms of Service</a>
            <span class="dot">&bull;</span>
            <a href="#accessibility" id="accessibility">Accessibility Statement</a>
            <span class="dot">&bull;</span>
            <a href="#help">Hyperlinking Policy</a>
            <span class="dot">&bull;</span>
            <a href="#help">Sitemap</a>
          </div>
        </div>
      </div>

    </footer>
  `,
  styles: [`
    .gov-footer {
      background-color: var(--color-gov-navy);
      color: #CBD5E1;
      font-size: 0.875rem;
      line-height: 1.6;
      border-top: 4px solid var(--color-deep-blue);
    }

    .footer-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .footer-initiatives-strip {
      background-color: rgba(6, 21, 40, 0.6);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 14px 0;
    }

    .initiatives-grid {
      display: flex;
      justify-content: space-around;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .initiative-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .init-badge {
      background-color: rgba(217, 119, 6, 0.2);
      color: #F59E0B;
      border: 1px solid rgba(217, 119, 6, 0.4);
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .init-title {
      color: #E2E8F0;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .footer-main-section {
      padding: 48px 0 36px;
    }

    .footer-columns-grid {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1.4fr 1.4fr;
      gap: 36px;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
    }

    .footer-brand-title {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;

      .hindi-text {
        font-family: var(--font-family-hindi, 'Noto Sans Devanagari', sans-serif);
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-saffron);
      }

      .eng-text {
        font-size: 1.35rem;
        font-weight: 800;
        color: #FFFFFF;
        letter-spacing: -0.01em;
      }
    }

    .footer-desc {
      color: #94A3B8;
      font-size: 0.825rem;
      line-height: 1.55;
      margin-bottom: 14px;
    }

    .statutory-note {
      font-size: 0.75rem;
      color: #CBD5E1;
      background: rgba(255, 255, 255, 0.05);
      border-left: 3px solid var(--color-saffron);
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      line-height: 1.4;

      strong {
        color: #FFFFFF;
      }
    }

    .col-heading {
      color: #FFFFFF;
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 16px;
      position: relative;
      padding-bottom: 8px;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 24px;
        height: 2px;
        background-color: var(--color-saffron);
      }
    }

    .footer-links-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li a {
        color: #94A3B8;
        text-decoration: none;
        font-size: 0.825rem;
        transition: color 0.15s ease;
        display: inline-block;

        &:hover, &:focus {
          color: #FFFFFF;
          text-decoration: underline;
        }
      }
    }

    .footer-bottom-bar {
      background-color: #061528;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px 0;
      font-size: 0.775rem;
    }

    .bottom-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .copyright-text {
      color: #94A3B8;

      strong {
        color: #E2E8F0;
      }
    }

    .compliance-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      a {
        color: #94A3B8;
        text-decoration: none;

        &:hover {
          color: #FFFFFF;
          text-decoration: underline;
        }
      }

      .dot {
        color: rgba(255, 255, 255, 0.2);
      }
    }

    @media (max-width: 1024px) {
      .footer-columns-grid {
        grid-template-columns: 1fr 1fr;
        gap: 28px;
      }
    }

    @media (max-width: 640px) {
      .footer-columns-grid {
        grid-template-columns: 1fr;
      }
      .bottom-flex {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class GovFooterComponent {
  private router = inject(Router);

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
