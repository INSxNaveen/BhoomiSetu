import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GovTopBarComponent } from '../../../shared/components/gov-top-bar/gov-top-bar.component';
import { GovHeaderComponent } from '../../../shared/components/gov-header/gov-header.component';
import { GovFooterComponent } from '../../../shared/components/gov-footer/gov-footer.component';
import { 
  PublicApiService, 
  PublicStatistics, 
  StateGeoSummary, 
  DistrictGeoSummary, 
  PublicInquiryResult, 
  PublicNotice 
} from '../../../core/http/public-api.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    GovTopBarComponent,
    GovHeaderComponent,
    GovFooterComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  private publicApi = inject(PublicApiService);

  // Accessibility State
  currentFontSize: 'sm' | 'md' | 'lg' = 'md';
  currentLanguage: 'en' | 'hi' = 'en';

  // Public Platform Statistics
  statsLoading = true;
  stats: PublicStatistics = {
    totalProjects: 16,
    totalProposals: 15,
    totalLandRequiredHectares: 1754.00,
    totalLandAcquiredHectares: 18.45,
    totalCompensationAssessedInr: 382800000,
    totalCompensationDisbursedInr: 231000000,
    statesCoveredCount: 6,
    districtsCoveredCount: 7,
    organizationsCount: 5,
    affectedFamiliesCount: 3,
    isDemonstrationData: true,
    dataSource: 'BhoomiSetu National Master Platform Demo Repository',
    generatedAt: new Date().toISOString()
  };

  // Geographic dropdowns from backend
  statesList: StateGeoSummary[] = [];
  filteredDistricts: DistrictGeoSummary[] = [];

  // Citizen Inquiry State
  inquiryQuery: string = 'UP-MRT-101';
  selectedState: string = 'Uttar Pradesh';
  selectedDistrict: string = 'Meerut';
  inquiryLoading = false;
  inquirySubmitted = false;
  inquiryResult: PublicInquiryResult | null = null;
  inquiryErrorMessage = '';

  // Public Notices
  notices: PublicNotice[] = [];
  noticesLoading = true;

  // FAQ Accordion State
  activeFaqIndex: number | null = 0;

  // Kisan Solatium Calculator (RFCTLARR Act 2013)
  calcLandAreaAcres: number = 3.5;
  calcCircleRatePerAcre: number = 2500000;
  calcAreaType: 'rural' | 'urban' = 'rural';
  calcYearsSinceNotification: number = 1.5;

  faqs = [
    {
      q: 'What is BhoomiSetu and its statutory role?',
      a: 'BhoomiSetu is the National Land Acquisition & Management Platform under the Government of India. It provides a single centralized digital source of truth for the entire statutory land acquisition lifecycle under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement (RFCTLARR) Act, 2013.'
    },
    {
      q: 'How can a citizen or landowner check acquisition status?',
      a: 'Enter your Survey Number / Khasra Number and select your State & District in the Citizen Inquiry section above. The portal verifies active gazette notifications (Section 4, Section 11, Section 19) and displays the authorized public stage without exposing confidential personal information.'
    },
    {
      q: 'How is compensation calculated under RFCTLARR Act 2013?',
      a: 'Compensation is determined according to Schedule 1 of the RFCTLARR Act 2013: Market Value × Rural Multiplier (up to 2.0x for rural land) + 100% Solatium grant + 12% additional interest per annum from the Section 11 preliminary notification date to the date of award.'
    },
    {
      q: 'How does Direct Benefit Transfer (DBT) work for compensation?',
      a: 'Once the Land Acquisition Collector passes the Section 23 Award, BhoomiSetu initiates automated payment tokens through the Public Financial Management System (PFMS). Payments are credited directly to the verified Aadhaar-linked bank accounts of entitled beneficiaries.'
    },
    {
      q: 'Who can access the official administrative portals?',
      a: 'Authorized officers from Project Implementing Agencies (e.g. NHAI, DFCCIL), District Collectorates, State Revenue Departments, Central Ministries, and System Administrators receive role-based access with multi-factor credentials. Unauthenticated users cannot access sensitive internal records.'
    },
    {
      q: 'How can a landowner raise objections or submit grievance?',
      a: 'Landowners can submit statutory objections within 60 days of Section 11 preliminary notification to the local Land Acquisition Collector or register grievances through the integrated CPGRAMS helpdesk portal.'
    }
  ];

  ngOnInit() {
    this.loadPublicStatistics();
    this.loadGeoSummary();
    this.loadPublicNotices();
  }

  onFontSizeChange(size: 'sm' | 'md' | 'lg') {
    this.currentFontSize = size;
  }

  onLanguageChange(lang: 'en' | 'hi') {
    this.currentLanguage = lang;
  }

  loadPublicStatistics() {
    this.statsLoading = true;
    this.publicApi.getStatistics().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats = res.data;
        }
        this.statsLoading = false;
      },
      error: () => {
        this.statsLoading = false;
      }
    });
  }

  loadGeoSummary() {
    this.publicApi.getGeoSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.statesList = res.data;
          this.onStateChanged();
        }
      }
    });
  }

  loadPublicNotices() {
    this.noticesLoading = true;
    this.publicApi.getNotices().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notices = res.data;
        }
        this.noticesLoading = false;
      },
      error: () => {
        this.noticesLoading = false;
      }
    });
  }

  onStateChanged() {
    const state = this.statesList.find(s => s.stateName === this.selectedState);
    if (state) {
      this.filteredDistricts = state.districts;
      if (this.filteredDistricts.length > 0 && !this.filteredDistricts.some(d => d.districtName === this.selectedDistrict)) {
        this.selectedDistrict = this.filteredDistricts[0].districtName;
      }
    } else {
      this.filteredDistricts = [];
      this.selectedDistrict = '';
    }
  }

  performInquiry() {
    const q = (this.inquiryQuery || '').trim();
    if (!q) {
      this.inquiryErrorMessage = 'Please enter a Survey Number or Khasra Number.';
      return;
    }

    this.inquiryErrorMessage = '';
    this.inquiryLoading = true;
    this.inquirySubmitted = true;

    this.publicApi.checkLandInquiry({
      surveyNumber: q,
      stateName: this.selectedState,
      districtName: this.selectedDistrict
    }).subscribe({
      next: (res) => {
        this.inquiryLoading = false;
        if (res.success && res.data) {
          this.inquiryResult = res.data;
        }
      },
      error: (err) => {
        this.inquiryLoading = false;
        this.inquiryErrorMessage = 'Unable to complete search request. Please try again.';
      }
    });
  }

  setSampleSearch(surveyNo: string, state: string, district: string) {
    this.inquiryQuery = surveyNo;
    this.selectedState = state;
    this.selectedDistrict = district;
    this.onStateChanged();
    this.performInquiry();
  }

  toggleFaq(index: number) {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  // Calculator Getters
  get calcMultiplier(): number {
    return this.calcAreaType === 'rural' ? 2.0 : 1.0;
  }

  get calcBaseMarketValue(): number {
    return this.calcLandAreaAcres * this.calcCircleRatePerAcre;
  }

  get calcMultipliedValue(): number {
    return this.calcBaseMarketValue * this.calcMultiplier;
  }

  get calcSolatiumAmount(): number {
    return this.calcMultipliedValue; // 100% Solatium
  }

  get calcAdditionalInterest(): number {
    return this.calcBaseMarketValue * 0.12 * this.calcYearsSinceNotification;
  }

  get calcTotalEstimatedCompensation(): number {
    return this.calcMultipliedValue + this.calcSolatiumAmount + this.calcAdditionalInterest;
  }

  formatInr(val: number): string {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
