import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface SampleSearchResult {
  surveyNumber: string;
  projectName: string;
  district: string;
  state: string;
  areaHectares: number;
  status: string;
  statusType: 'success' | 'warning' | 'info';
  compensationStatus: string;
  totalCompensation: string;
  dbtStatus: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  private router = inject(Router);

  searchQuery = '245/1A';
  searchDistrict = 'Meerut';
  searched = false;
  searchResult: SampleSearchResult | null = null;

  activeFaqIndex: number | null = 0;

  corridors = [
    {
      code: 'NH-48-EXP-01',
      name: 'NH-48 Delhi-Meerut Expressway Expansion Phase 3',
      state: 'Uttar Pradesh',
      district: 'Meerut',
      area: '124.5 Ha',
      cost: '₹ 1,250 Cr',
      status: 'Possession Phase',
      progress: 88,
      type: 'Expressway Corridor'
    },
    {
      code: 'MH-PNE-RR-02',
      name: 'Pune Ring Road Western Alignment Section 2',
      state: 'Maharashtra',
      district: 'Pune',
      area: '210.0 Ha',
      cost: '₹ 2,800 Cr',
      status: 'Award Valuation',
      progress: 45,
      type: 'Ring Road Corridor'
    },
    {
      code: 'WDFC-GJ-SEC04',
      name: 'Western Dedicated Freight Corridor (WDFC) Sanand Link',
      state: 'Gujarat',
      district: 'Ahmedabad',
      area: '340.0 Ha',
      cost: '₹ 4,100 Cr',
      status: 'Acquisition Completed',
      progress: 100,
      type: 'Freight Rail Corridor'
    },
    {
      code: 'SOL-RJ-JPR-01',
      name: 'Jaipur-Bikaner Green Energy Transmission Corridor',
      state: 'Rajasthan',
      district: 'Jaipur',
      area: '190.0 Ha',
      cost: '₹ 950 Cr',
      status: 'Sec 11 Notification',
      progress: 30,
      type: 'Renewable Power Corridor'
    }
  ];

  faqs = [
    {
      q: 'How is land compensation, solatium and statutory interest calculated under RFCTLARR 2013?',
      a: 'Compensation is determined based on the prevailing circle rate / market rate multiplied by the statutory rural factor (1.0x to 2.0x). A 100% Solatium (mandatory statutory bonus) is added to the market value, along with 12% annual interest computed from the date of preliminary notification (Section 11) up to the award declaration.'
    },
    {
      q: 'How is compensation disbursed directly to the verified bank account of landowners?',
      a: 'All compensation awards are processed electronically via Direct Benefit Transfer (DBT) integrated with PFMS and e-Kuber. Once the District Collector / CALA approves the award and title verification is completed, funds credit directly into the beneficiary account without intermediaries.'
    },
    {
      q: 'What is the procedure for filing objections or boundary dispute corrections?',
      a: 'Landowners can submit digital objection inquiries directly through BhoomiSetu or visit the designated Competent Authority for Land Acquisition (CALA) during the statutory 60-day window following the Section 11 gazette publication.'
    },
    {
      q: 'What rehabilitation packages are provided to displaced families under the Second Schedule?',
      a: 'Displaced families are entitled to constructed housing allotments in designated resettlement zones or a one-time financial grant, monthly subsistence allowance for 12 months, cattle shed assistance, and transportation cost reimbursement.'
    },
    {
      q: 'How do project implementing agencies (NHAI, Railways, PWD) submit alignment proposals?',
      a: 'Agencies register with their official credentials, upload CAD/GIS shapefiles and land schedules, and submit their alignment proposals directly to the State Empowered Committee and District Collectorates for joint survey scheduling.'
    }
  ];

  performSearch() {
    this.searched = true;
    const query = this.searchQuery.trim().toUpperCase();

    if (query.includes('245') || query === '245/1A') {
      this.searchResult = {
        surveyNumber: '245/1A',
        projectName: 'NH-48 Delhi-Meerut Expressway Expansion Phase 3',
        district: 'Meerut',
        state: 'Uttar Pradesh',
        areaHectares: 4.25,
        status: 'Possession Handover Completed',
        statusType: 'success',
        compensationStatus: 'Compensation Disbursed via DBT (₹ 3.45 Cr)',
        totalCompensation: '₹ 3,45,00,000',
        dbtStatus: 'Credited to State Bank of India Account (PFMS Ref: DBT-UP-2026-88392)'
      };
    } else if (query.includes('112') || query === '112/3B') {
      this.searchResult = {
        surveyNumber: '112/3B',
        projectName: 'NH-48 Expressway Package 3 Alignment',
        district: 'Meerut',
        state: 'Uttar Pradesh',
        areaHectares: 6.80,
        status: 'Valuation Award Declared • In Payment Queue',
        statusType: 'warning',
        compensationStatus: 'Award Sanctioned (₹ 4.80 Cr)',
        totalCompensation: '₹ 4,80,00,000',
        dbtStatus: 'Bank Verification In Progress with CALA Meerut'
      };
    } else if (query.includes('502') || query === '502/1') {
      this.searchResult = {
        surveyNumber: '502/1',
        projectName: 'Western Dedicated Freight Corridor (WDFC) Sanand Link',
        district: 'Ahmedabad',
        state: 'Gujarat',
        areaHectares: 14.20,
        status: 'Possession Taken • Verified',
        statusType: 'success',
        compensationStatus: 'Full DBT Payout Settled (₹ 11.20 Cr)',
        totalCompensation: '₹ 11,20,00,000',
        dbtStatus: 'PFMS DBT Reference: DBT-GJ-2026-00481'
      };
    } else {
      this.searchResult = {
        surveyNumber: this.searchQuery || 'Survey #88/4C',
        projectName: 'Pune Ring Road Western Alignment Section 2',
        district: this.searchDistrict,
        state: 'Maharashtra',
        areaHectares: 8.50,
        status: 'Joint Measurement Survey (JMS) In Progress',
        statusType: 'info',
        compensationStatus: 'Estimated Valuation: ₹ 5.82 Cr',
        totalCompensation: '₹ 5,82,00,000 (Estimated)',
        dbtStatus: 'Awaiting Final Award Declaration'
      };
    }
  }

  toggleFaq(index: number) {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToCentralDashboard() {
    this.router.navigate(['/login'], { queryParams: { role: 'central.admin' } });
  }

  scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
