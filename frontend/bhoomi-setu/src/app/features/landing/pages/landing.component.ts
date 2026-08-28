import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

export interface IndianLandParcelResult {
  ulpin: string; // 14-digit Bhu-Aadhaar
  khasraNo: string;
  village: string;
  tehsil: string;
  district: string;
  state: string;
  projectName: string;
  implementingAgency: string; // NHAI, DFCCIL, NHSRCL, SECI
  landCategory: 'Agricultural (Irrigated)' | 'Agricultural (Unirrigated)' | 'Non-Agricultural / Commercial' | 'Government Wasteland';
  areaHectares: string;
  areaAcres: string;
  circleRate: string;
  marketValuation: string;
  multiplierFactor: string;
  solatiumAmount: string;
  totalCompensation: string;
  notificationStatus: 'Section 11 Notified' | 'Section 19 Award Declared' | 'DBT Disbursed • Mutation Complete' | 'SIA Public Hearing';
  statusType: 'success' | 'warning' | 'info';
  dbtStatus: string;
  pfmsReference: string;
}

export interface GatiShaktiCorridor {
  code: string;
  name: string;
  agency: 'NHAI' | 'Indian Railways' | 'DFCCIL' | 'NHSRCL' | 'MNRE / SECI' | 'MoPSW';
  sector: 'Bharatmala Highways' | 'Railways & DFC' | 'Solar & Green Energy' | 'Sagarmala Ports';
  states: string;
  lengthOrArea: string;
  capitalBudget: string;
  status: string;
  progress: number;
  landAcquiredHectares: string;
  farmersBenefited: string;
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

  // Search & Due Diligence Explorer (Bhu-Aadhaar / ULPIN / Khasra)
  searchQuery = '14-ULPIN-MH-892041';
  searchState = 'All States';
  searched = true;
  searchResult: IndianLandParcelResult | null = null;

  // Corridor Filters
  activeCorridorFilter: 'All' | 'Bharatmala Highways' | 'Railways & DFC' | 'Solar & Green Energy' | 'Sagarmala Ports' = 'All';

  // Hero Preview Layer
  activePreviewLayer: 'bhuvan' | 'cadastral' | 'notification' | 'dbt' = 'bhuvan';

  // Active Capabilities / 7 Engines Tab
  activeEngineTab: 'highways' | 'railways' | 'solar' | 'ports' | 'digital' = 'highways';

  // FAQ Accordion
  activeFaqIndex: number | null = 0;

  // Kisan Solatium Calculator Inputs (RFCTLARR Act 2013)
  calcLandAreaAcres: number = 4.5;
  calcCircleRatePerAcre: number = 2500000; // ₹25 Lakhs per acre
  calcAreaType: 'rural' | 'urban' = 'rural';
  calcYearsSinceNotification: number = 1.5; // 12% per annum additional interest

  // Request Help / Grievance Modal State
  showGrievanceModal = false;
  grievanceSubmitted = false;
  grievanceData = {
    fullName: '',
    mobileNumber: '',
    aadhaarNumber: '',
    state: 'Maharashtra',
    district: '',
    khasraUlpin: '',
    grievanceType: 'Compensation Delayed under PFMS',
    description: ''
  };

  corridors: GatiShaktiCorridor[] = [
    {
      code: 'PMGS-NH-NE4',
      name: 'Delhi - Mumbai Expressway (NE-4) 8-Lane Greenfield Alignment',
      agency: 'NHAI',
      sector: 'Bharatmala Highways',
      states: 'Haryana, Rajasthan, MP, Gujarat, Maharashtra',
      lengthOrArea: '1,386 km',
      capitalBudget: '₹1,05,000 Cr',
      status: '96% Land Transferred • Operational in Phases',
      progress: 96,
      landAcquiredHectares: '15,480 Ha',
      farmersBenefited: '1.24 Lakh Kisans'
    },
    {
      code: 'PMGS-DFC-WEST',
      name: 'Western Dedicated Freight Corridor (Dadri to JNPT Port)',
      agency: 'DFCCIL',
      sector: 'Railways & DFC',
      states: 'UP, Haryana, Rajasthan, Gujarat, Maharashtra',
      lengthOrArea: '1,504 km',
      capitalBudget: '₹52,800 Cr',
      status: '99% Land Acquired • Heavy Haul Electric Trial',
      progress: 99,
      landAcquiredHectares: '11,200 Ha',
      farmersBenefited: '89,400 Kisans'
    },
    {
      code: 'PMGS-HSR-MAHSR',
      name: 'Mumbai - Ahmedabad High-Speed Bullet Train Corridor',
      agency: 'NHSRCL',
      sector: 'Railways & DFC',
      states: 'Maharashtra, Gujarat, Dadra & Nagar Haveli',
      lengthOrArea: '508 km',
      capitalBudget: '₹1,10,000 Cr',
      status: '100% Land Handover in Gujarat • Pier Erection',
      progress: 92,
      landAcquiredHectares: '1,434 Ha',
      farmersBenefited: '28,600 Kisans'
    },
    {
      code: 'PMGS-RE-KHAVDA',
      name: 'Khavda 30GW Ultra-Mega Hybrid Renewable Energy Park',
      agency: 'MNRE / SECI',
      sector: 'Solar & Green Energy',
      states: 'Kutch, Gujarat',
      lengthOrArea: '72,600 Ha',
      capitalBudget: '₹1,50,000 Cr',
      status: 'Government Wasteland Leased • Transmission Live',
      progress: 85,
      landAcquiredHectares: '72,600 Ha',
      farmersBenefited: 'Direct State Revenue'
    },
    {
      code: 'PMGS-PORT-VADHAVAN',
      name: 'Vadhavan Mega Deepwater Port & Rail Intermodal Connectivity',
      agency: 'MoPSW',
      sector: 'Sagarmala Ports',
      states: 'Palghar, Maharashtra',
      lengthOrArea: '4,500 Acres',
      capitalBudget: '₹76,200 Cr',
      status: 'Cabinet Approved • Joint Survey Underway',
      progress: 48,
      landAcquiredHectares: '1,820 Ha',
      farmersBenefited: '14,200 Landowners'
    },
    {
      code: 'PMGS-SOLAR-REWA',
      name: 'Rewa 750MW Ultra Mega Solar Power Station Grid Corridors',
      agency: 'MNRE / SECI',
      sector: 'Solar & Green Energy',
      states: 'Gurh Tehsil, Rewa, Madhya Pradesh',
      lengthOrArea: '1,590 Ha',
      capitalBudget: '₹4,500 Cr',
      status: 'Fully Commissioned • 100% DBT Settled',
      progress: 100,
      landAcquiredHectares: '1,590 Ha',
      farmersBenefited: '8,450 Kisans'
    }
  ];

  faqs = [
    {
      q: 'How does BhoomiSetu calculate farmer compensation under the RFCTLARR Act 2013?',
      a: 'Compensation is strictly calculated according to the First Schedule of the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013. For rural land, the base circle rate/market value is multiplied by a rural factor (between 1.25x and 2.0x depending on distance from urban centers), followed by a mandatory 100% Solatium grant plus 12% additional interest per annum from the Section 11 preliminary notification date.'
    },
    {
      q: 'What is Bhu-Aadhaar (ULPIN) and how is it used in national infrastructure acquisition?',
      a: 'Unique Land Parcel Identification Number (ULPIN), also termed Bhu-Aadhaar, is an electronic 14-digit alphanumeric code generated via geographic coordinates (latitude-longitude) of land parcel vertices. BhoomiSetu integrates with National Geo-Information System (NGIS) and State Land Records to guarantee zero duplicate registrations and flawless boundary demarcation for infrastructure corridors.'
    },
    {
      q: 'How does Direct Benefit Transfer (DBT) and PFMS work for compensation payment?',
      a: 'Once the Land Acquisition Collector (LAC) passes the Section 23 Award, BhoomiSetu triggers direct API settlement through the Public Financial Management System (PFMS) directly into the verified Aadhaar-seeded bank account of the beneficiary farmer. This eliminates middlemen, commission cuts, and bureaucratic delay.'
    },
    {
      q: 'Can a citizen file objections or check the status of Social Impact Assessment (SIA)?',
      a: 'Yes. Citizens and Gram Sabhas can view public notices under Section 4(1) and Section 11, submit formal objections within the statutory 60-day window, download Social Impact Management Plans (SIMP), and track CPGRAMS grievances through BhoomiSetu with end-to-end SMS and DigiLocker tracking.'
    },
    {
      q: 'Which Central Ministries and State Government departments are integrated on BhoomiSetu?',
      a: 'BhoomiSetu unites PM GatiShakti National Master Plan, Ministry of Rural Development (Department of Land Resources), Ministry of Road Transport & Highways (NHAI), Ministry of Railways (DFCCIL, NHSRCL), Ministry of New and Renewable Energy (SECI), Ministry of Ports, Shipping and Waterways, alongside 28 State Revenue and Survey Departments.'
    }
  ];

  ngOnInit() {
    this.performSearch();
  }

  get filteredCorridors(): GatiShaktiCorridor[] {
    if (this.activeCorridorFilter === 'All') {
      return this.corridors;
    }
    return this.corridors.filter(c => c.sector === this.activeCorridorFilter);
  }

  // Calculated Kisan Compensation Values (RFCTLARR Act 2013)
  get multiplier(): number {
    return this.calcAreaType === 'rural' ? 2.0 : 1.0;
  }

  get baseMarketValue(): number {
    return this.calcLandAreaAcres * this.calcCircleRatePerAcre;
  }

  get multipliedValue(): number {
    return this.baseMarketValue * this.multiplier;
  }

  get solatiumAmount(): number {
    return this.multipliedValue; // 100% Solatium
  }

  get additionalInterest(): number {
    // 12% per annum on market value
    return this.baseMarketValue * 0.12 * this.calcYearsSinceNotification;
  }

  get totalEstimatedCompensation(): number {
    return this.multipliedValue + this.solatiumAmount + this.additionalInterest;
  }

  get formattedTotalCompensation(): string {
    const total = this.totalEstimatedCompensation;
    if (total >= 10000000) {
      return `₹${(total / 10000000).toFixed(2)} Crore`;
    }
    return `₹${(total / 100000).toFixed(2)} Lakh`;
  }

  get formattedBaseValue(): string {
    const val = this.baseMarketValue;
    return val >= 10000000 ? `₹${(val / 10000000).toFixed(2)} Cr` : `₹${(val / 100000).toFixed(2)} L`;
  }

  get formattedSolatium(): string {
    const val = this.solatiumAmount;
    return val >= 10000000 ? `₹${(val / 10000000).toFixed(2)} Cr` : `₹${(val / 100000).toFixed(2)} L`;
  }

  get formattedInterest(): string {
    const val = this.additionalInterest;
    return val >= 10000000 ? `₹${(val / 10000000).toFixed(2)} Cr` : `₹${(val / 100000).toFixed(2)} L`;
  }

  setPreviewLayer(layer: 'bhuvan' | 'cadastral' | 'notification' | 'dbt') {
    this.activePreviewLayer = layer;
  }

  setEngineTab(tab: 'highways' | 'railways' | 'solar' | 'ports' | 'digital') {
    this.activeEngineTab = tab;
  }

  setCorridorFilter(filter: 'All' | 'Bharatmala Highways' | 'Railways & DFC' | 'Solar & Green Energy' | 'Sagarmala Ports') {
    this.activeCorridorFilter = filter;
  }

  performSearch() {
    this.searched = true;
    const query = (this.searchQuery || '').trim().toUpperCase();

    if (query.includes('8920') || query.includes('MH') || query.includes('MAHSR')) {
      this.searchResult = {
        ulpin: '14-ULPIN-MH-892041',
        khasraNo: 'Khasra No. 142/3A & 142/3B',
        village: 'Kalyan (Rural)',
        tehsil: 'Bhiwandi',
        district: 'Thane',
        state: 'Maharashtra',
        projectName: 'Mumbai - Ahmedabad High Speed Bullet Train (MAHSR Package C-4)',
        implementingAgency: 'National High Speed Rail Corporation Ltd (NHSRCL)',
        landCategory: 'Agricultural (Irrigated)',
        areaHectares: '1.42 Ha',
        areaAcres: '3.51 Acres',
        circleRate: '₹48,00,000 / Acre',
        marketValuation: '₹1,68,48,000',
        multiplierFactor: '2.0x (Rural Multiplier Schedule 1)',
        solatiumAmount: '₹3,36,96,000 (100% Mandatory Solatium)',
        totalCompensation: '₹7,14,35,520 (Incl. 12% Interest)',
        notificationStatus: 'DBT Disbursed • Mutation Complete',
        statusType: 'success',
        dbtStatus: '100% Transferred to Bank Account via PFMS / Aadhaar',
        pfmsReference: 'PFMS-DBT-2026-MH-894210'
      };
    } else if (query.includes('4102') || query.includes('UP') || query.includes('EXPRESSWAY')) {
      this.searchResult = {
        ulpin: '14-ULPIN-UP-410299',
        khasraNo: 'Khasra No. 318 / 12',
        village: 'Jewar (Bangar)',
        tehsil: 'Jewar',
        district: 'Gautam Buddha Nagar',
        state: 'Uttar Pradesh',
        projectName: 'Noida International Airport (Jewar) Express Rail & Road Multi-Modal Link',
        implementingAgency: 'National Highways Authority of India (NHAI) / YEDA',
        landCategory: 'Agricultural (Irrigated)',
        areaHectares: '0.85 Ha',
        areaAcres: '2.10 Acres',
        circleRate: '₹35,00,000 / Acre',
        marketValuation: '₹73,50,000',
        multiplierFactor: '2.0x (Rural Multiplier Schedule 1)',
        solatiumAmount: '₹1,47,0000 (100% Mandatory Solatium)',
        totalCompensation: '₹3,11,64,000 (Award Declared)',
        notificationStatus: 'Section 19 Award Declared',
        statusType: 'info',
        dbtStatus: 'PFMS Token Generated • Beneficiary Aadhaar Verification Underway',
        pfmsReference: 'PFMS-DBT-2026-UP-410283'
      };
    } else if (query.includes('301') || query.includes('GJ') || query.includes('DFC')) {
      this.searchResult = {
        ulpin: '14-ULPIN-GJ-301188',
        khasraNo: 'Survey No. 248 / Block B',
        village: 'Palanpur Rural',
        tehsil: 'Palanpur',
        district: 'Banaskantha',
        state: 'Gujarat',
        projectName: 'Western Dedicated Freight Corridor (WDFC Palanpur - Makarpura Section)',
        implementingAgency: 'Dedicated Freight Corridor Corporation of India (DFCCIL)',
        landCategory: 'Non-Agricultural / Commercial',
        areaHectares: '0.62 Ha',
        areaAcres: '1.53 Acres',
        circleRate: '₹62,00,000 / Acre',
        marketValuation: '₹94,86,000',
        multiplierFactor: '1.0x (Urban / Industrial Classification)',
        solatiumAmount: '₹94,86,000 (100% Solatium)',
        totalCompensation: '₹2,01,10,320 (Full Settlement Disbursed)',
        notificationStatus: 'DBT Disbursed • Mutation Complete',
        statusType: 'success',
        dbtStatus: 'DBT Credit Completed to State Bank of India Account',
        pfmsReference: 'PFMS-DBT-2026-GJ-301194'
      };
    } else {
      this.searchResult = {
        ulpin: '14-ULPIN-IN-GENERIC',
        khasraNo: 'Khasra No. 89 / 4',
        village: 'National Corridor Zone',
        tehsil: 'Central Tehsil',
        district: 'Regional Infrastructure Hub',
        state: 'Government of India',
        projectName: 'PM GatiShakti Multi-Modal Infrastructure Corridor',
        implementingAgency: 'Central Infrastructure Authority (MoRTH / MoR)',
        landCategory: 'Agricultural (Irrigated)',
        areaHectares: '1.20 Ha',
        areaAcres: '2.96 Acres',
        circleRate: '₹30,00,000 / Acre',
        marketValuation: '₹88,80,000',
        multiplierFactor: '2.0x (Rural Multiplier Schedule 1)',
        solatiumAmount: '₹1,77,60,000 (100% Solatium)',
        totalCompensation: '₹3,77,22,240',
        notificationStatus: 'Section 11 Notified',
        statusType: 'info',
        dbtStatus: 'Joint Cadastral Survey & Drone Verification in Progress',
        pfmsReference: 'PFMS-PENDING-STAGE2'
      };
    }
  }

  setDemoQuery(code: string) {
    this.searchQuery = code;
    this.performSearch();
  }

  openGrievanceModal() {
    this.showGrievanceModal = true;
    this.grievanceSubmitted = false;
  }

  closeGrievanceModal() {
    this.showGrievanceModal = false;
  }

  submitGrievance() {
    this.grievanceSubmitted = true;
  }

  toggleFaq(index: number) {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
