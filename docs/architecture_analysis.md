# National Land Acquisition & Management System (BhoomiSetu)
## Architectural Analysis & Technical Implementation Blueprint

---

## Executive Summary
This document establishes the comprehensive technical architecture, data model, RBAC security framework, GIS integration model, and workflow state engine for **BhoomiSetu** (National Land Acquisition & Management System).

The system is designed as a multi-tenant, role-scoped, spatial-enabled enterprise platform facilitating the end-to-end land acquisition lifecycle under the RFCTLARR Act framework across Central, State, District, and Project Agency tiers in India.

---

## A. Overall System Understanding

**Core Philosophy:** 
> *One Project → One Digital Land Acquisition Lifecycle → Multiple Authorized Stakeholders → One Centralized Source of Truth.*

```
+---------------------------------------------------------------------------------------------------+
|                                         BHOOMI SETU PLATFORM                                      |
+---------------------------------------------------------------------------------------------------+
|  Central Admin    |  State Admin        |  District Admin     |  Project Agency   |  Super Admin  |
|  - National Stats |  - State Review     |  - Verification     |  - Proposal Submit|  - System Mgmt|
|  - Inter-State    |  - State Approvals  |  - Land Verification|  - Milestone Track|  - User/RBAC  |
|  - Analytics      |  - District Oversight| - Field Reports    |  - Compensation   |  - Audit Log  |
+-------------------+---------------------+---------------------+-------------------+---------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------------+
|                                   CENTRAL WORKFLOW & AGGREGATE CORE                                |
|  Draft -> Submitted -> District Verification -> State Review -> Approved -> Acquisition ->        |
|  Compensation -> Possession -> Rehabilitation & Resettlement -> Completed                         |
+---------------------------------------------------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------------+
|                                  SPATIAL & FINANCIAL DATA CORE                                    |
|  - GeoJSON / PostGIS Land Parcels (Survey #, Area, Polygon Boundaries)                            |
|  - Financial Compensation Assessments, Solatium, Interest & Disbursement Records                  |
|  - Affected Families & Rehabilitation & Resettlement (R&R) Package Tracking                       |
+---------------------------------------------------------------------------------------------------+
```

---

## B. Architecture Assessment

The proposed architecture adopts **Clean Architecture** principles decoupled across backend and frontend layers:

1. **Backend (ASP.NET Core 8 + EF Core + PostgreSQL/PostGIS)**:
   - `BhoomiSetu.Domain`: Core business aggregates, value objects, domain events, business invariants. Free from external dependencies.
   - `BhoomiSetu.Application`: MediatR commands/queries (CQRS), DTOs, FluentValidation, domain interfaces.
   - `BhoomiSetu.Infrastructure`: EF Core DbContext, PostGIS spatial queries, JWT Token Generation, Local File Storage, System Seeders.
   - `BhoomiSetu.API`: ASP.NET Core 8 Web API / Controllers, Middleware, Auth Policies, Swagger OpenAPI spec.

2. **Frontend (Angular 19 + TailwindCSS + Angular Material + Leaflet GIS)**:
   - **Feature-Driven Layout (`src/app/features/`)**: High cohesion per domain (`projects`, `proposals`, `gis`, `parcels`, `compensation`, `possession`, `rehabilitation`, `dashboard`, `reports`, `audit`, `administration`).
   - **Role Layer (`src/app/roles/`)**: Ultra-thin configuration & route mappings (Roles specify *access*, Features specify *behavior*).
   - **Core Layer (`src/app/core/`)**: Cross-cutting Auth, Interceptors, Guards, API Client, Layouts.
   - **Shared Layer (`src/app/shared/`)**: UI design system components, directives (`*hasPermission`), pipes, formatters.

---

## C. Problems Identified & Architectural Fixes

| # | Identified Challenge / Inconsistency | Risk | Architectural Solution |
|---|---------------------------------------|------|------------------------|
| 1 | **Role Duplication vs UI Components** | Maintenance overhead, UI divergence between roles | Decouple roles from components. Roles define permissions & route configurations; components render dynamically based on `*hasPermission`. |
| 2 | **PostGIS & EF Core Mapping** | Spatial query performance & serializer mismatch | Utilize `NetTopologySuite` with `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`. Convert geometry to GeoJSON DTOs for Angular Leaflet integration. |
| 3 | **Tenant / Data Scoping Vulnerabilities** | Cross-district or cross-state data leaks | Implement ASP.NET Core Claims-based Data Scoping (`StateId`, `DistrictId`, `OrganizationId`) enforced automatically in EF Core Global Query Filters & MediatR Pipeline Behaviors. |
| 4 | **Workflow State Fragmentation** | Invalid status transitions via direct database edits or API calls | Implement an explicit, immutable Workflow State Machine in `BhoomiSetu.Domain/Proposals/ProposalWorkflow.cs` with validation rules per transition. |
| 5 | **Document Security & Storage** | File tampering, storage pollution | Store files out-of-web-root via `IFileStorageService` abstraction. Database stores SHA-256 hash, metadata, and versioning. |

---

## D. Recommended Architectural Enhancements

1. **Standardized API Response Envelope (`ApiResponse<T>`)**:
   Uniform JSON structure across all success and error responses.
2. **Global Exception Handling Middleware**:
   Translates domain/validation exceptions into standardized RFC-7807 Problem Details.
3. **Dynamic GIS Layer Service**:
   GeoJSON endpoints formatted for direct consumption by Leaflet maps with custom status styling (e.g., Green = Acquired, Orange = Pending Compensation, Red = Disputed).
4. **Audit Logging Interceptor**:
   EF Core `SaveChangesInterceptor` automatically captures `CreatedBy`, `CreatedAt`, `UpdatedBy`, `UpdatedAt`, and full change deltas in JSONB format.

---

## E. Complete Repository & Directory Blueprint

```
BhoomiSetu/
│
├── frontend/
│   └── bhoomi-setu/
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/
│       │   │   │   ├── auth/ (guards, interceptors, services, models)
│       │   │   │   ├── config/ (app.config, api.config, environment)
│       │   │   │   ├── http/ (api-client.service, api-response.model)
│       │   │   │   ├── layout/ (main-layout, auth-layout, admin-layout, header, sidebar)
│       │   │   │   └── state/ (app-state.service)
│       │   │   ├── shared/
│       │   │   │   ├── components/ (button, modal, data-table, status-badge, loading-spinner, page-header, stats-card, file-upload)
│       │   │   │   ├── directives/ (has-permission.directive)
│       │   │   │   ├── pipes/ (status-badge.pipe, area-formatter.pipe, currency-inr.pipe, date-format.pipe)
│       │   │   │   └── utils/
│       │   │   ├── features/
│       │   │   │   ├── dashboard/
│       │   │   │   ├── projects/
│       │   │   │   ├── proposals/
│       │   │   │   ├── gis/
│       │   │   │   ├── parcels/
│       │   │   │   ├── compensation/
│       │   │   │   ├── possession/
│       │   │   │   ├── rehabilitation/
│       │   │   │   ├── reports/
│       │   │   │   ├── notifications/
│       │   │   │   ├── audit/
│       │   │   │   └── administration/
│       │   │   ├── roles/
│       │   │   │   ├── super-admin/
│       │   │   │   ├── central-admin/
│       │   │   │   ├── state-admin/
│       │   │   │   ├── district-admin/
│       │   │   │   └── project-agency/
│       │   │   ├── app.routes.ts
│       │   │   ├── app.config.ts
│       │   │   └── app.component.ts
│       │   ├── assets/
│       │   └── styles/
│       └── package.json
│
├── backend/
│   ├── BhoomiSetu.API/ (Controllers, Middleware, Filters, Program.cs)
│   ├── BhoomiSetu.Application/ (CQRS Commands, Queries, DTOs, Validators)
│   ├── BhoomiSetu.Domain/ (Entities, Enums, ValueObjects, Events)
│   ├── BhoomiSetu.Infrastructure/ (DbContext, Configurations, Seeders, Auth, FileStorage, GIS)
│   └── BhoomiSetu.Tests/
│
└── database/
    └── init.sql
```

---

## F. Domain Model (Entities & Aggregates)

```
                            +--------------------+
                            |    Organization    |
                            +---------+----------+
                                      |
                                      v
                            +--------------------+
                            |        User        |
                            +---------+----------+
                                      |
                                      v
                            +--------------------+
                            |      Project       |
                            +---------+----------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
       +------------------+                      +-------------------+
       |     Proposal     |                      |  AcquisitionCase  |
       +--------+---------+                      +---------+---------+
                |                                          |
                v                                 +--------+--------+--------+
       +------------------+                       |                 |        |
       |  ProposalReview  |                       v                 v        v
       +------------------+                +------------+    +------------+ +-------------+
                                           | LandParcel |    | Compensation| | Possession  |
                                           +-----+------+    +------------+ +-------------+
                                                 |                          |
                                                 v                          v
                                           +------------+            +-------------+
                                           | ParcelOwner|            |  R&R Case   |
                                           +------------+            +-------------+
```

---

## G. Database Design & Schemas (PostgreSQL + PostGIS)

### 1. Identity Schema (`identity`)
- `organizations`: `id`, `name`, `code`, `org_type`, `parent_org_id`, `state_id`, `district_id`, `created_at`.
- `users`: `id`, `organization_id`, `state_id`, `district_id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `is_active`.
- `roles`: `id`, `name`, `description`.
- `permissions`: `id`, `code`, `name`, `module`.
- `user_roles`: `user_id`, `role_id`.
- `role_permissions`: `role_id`, `permission_id`.

### 2. Geography Schema (`geography`)
- `states`: `id`, `code`, `name`.
- `districts`: `id`, `state_id`, `code`, `name`.
- `tehsils`: `id`, `district_id`, `name`.
- `villages`: `id`, `tehsil_id`, `name`.

### 3. Project Schema (`project`)
- `projects`: `id`, `project_code`, `name`, `description`, `project_type`, `organization_id`, `state_id`, `district_id`, `estimated_cost`, `required_area_hectares`, `status`, `created_by`, `created_at`.
- `project_milestones`: `id`, `project_id`, `name`, `planned_date`, `actual_date`, `status`, `sequence_number`.
- `proposals`: `id`, `proposal_number`, `project_id`, `submitted_by`, `submitted_at`, `status`, `land_area_proposed`, `affected_family_count`, `estimated_compensation`, `current_stage`, `created_at`.
- `proposal_reviews`: `id`, `proposal_id`, `reviewer_id`, `reviewer_role`, `action`, `comments`, `reviewed_at`.

### 4. Land & Spatial Schema (`land`)
- `land_parcels`: `id`, `project_id`, `state_id`, `district_id`, `tehsil_id`, `village_id`, `survey_number`, `parcel_number`, `area_hectares`, `land_type`, `acquisition_status`, `geometry GEOMETRY(POLYGON, 4326)`.
- `parcel_owners`: `id`, `parcel_id`, `owner_name`, `ownership_percentage`, `is_primary_owner`.

### 5. Acquisition & Financial Schemas (`acquisition`, `finance`, `rehabilitation`)
- `acquisition_cases`: `id`, `project_id`, `case_number`, `status`, `start_date`, `target_completion_date`.
- `notifications`: `id`, `acquisition_case_id`, `notification_number`, `notification_type`, `notification_date`.
- `awards`: `id`, `acquisition_case_id`, `parcel_id`, `award_number`, `assessed_amount`, `award_date`.
- `compensation_assessments`: `id`, `project_id`, `parcel_id`, `assessed_amount`, `solatium_amount`, `interest_amount`, `total_amount`, `status`.
- `compensation_payments`: `id`, `assessment_id`, `payment_reference`, `amount`, `payment_date`, `status`.
- `possessions`: `id`, `project_id`, `parcel_id`, `possession_date`, `status`, `verified_by`.
- `affected_families`: `id`, `project_id`, `parcel_id`, `family_reference`, `family_size`, `is_displaced`, `village_id`.
- `rehabilitation_cases`: `id`, `affected_family_id`, `status`, `rehabilitation_site`, `eligible_amount`, `provided_amount`.

---

## H. API Architecture & REST Specifications

### Auth API (`/api/v1/auth`)
- `POST /login` -> Returns JWT token + claims + permissions + user info.
- `GET /me` -> Returns active user context.

### Proposals API (`/api/v1/proposals`)
- `GET /` -> List proposals (filtered by user scope).
- `GET /{id}` -> Proposal details.
- `POST /` -> Create proposal (Project Agency).
- `POST /{id}/submit` -> Submit proposal for verification.
- `POST /{id}/verify` -> District Admin verification.
- `POST /{id}/approve` -> State Admin approval.
- `POST /{id}/return` -> Return to agency for correction.

### Land & GIS API (`/api/v1/gis`, `/api/v1/parcels`)
- `GET /api/v1/gis/projects/{id}/parcels` -> Returns GeoJSON FeatureCollection.
- `GET /api/v1/parcels` -> Filtered list of land parcels.

### Compensation & Possession APIs
- `GET /api/v1/compensation` -> Compensation dashboard data.
- `POST /api/v1/compensation/payments` -> Record compensation disbursement.
- `POST /api/v1/possession` -> Record possession handover.

---

## I. Frontend Architecture & Design System

1. **Enterprise SaaS Palette**: Deep Navy (`#0f172a`), Slate Blue (`#1e293b`), Emerald Green (`#059669`), Warm Amber (`#d97706`), Crimson Red (`#dc2626`).
2. **Component Architecture**: Modular Standalone Angular Components (`imports: [CommonModule, RouterModule, ReactiveFormsModule, LeafletModule, ...]`).
3. **State Management**: Reactive RxJS `BehaviorSubject` / Service-based state pattern (`AppStateService`, `AuthService`).

---

## J. RBAC & Data Scoping Matrix

| Module / Feature | Super Admin | Central Admin | State Admin | District Admin | Project Agency | Data Scope Boundary |
|------------------|-------------|---------------|-------------|----------------|----------------|---------------------|
| User Management  | Full (CRUD) | Read Only     | Read Only   | None           | None           | Global / State      |
| Projects         | Read        | Read (All)    | Read (State)| Read (District)| Create / Edit  | Org / Geography Scope|
| Proposals        | Read        | Read (All)    | Approve     | Verify         | Create / Submit| Scope Restricted    |
| GIS & Parcels    | Read        | Read (All)    | Read        | Verify Parcels | Read           | Geographic Filter   |
| Compensation     | Read        | Read (All)    | Overview    | Record Payment | View Summary   | District / Project  |
| Possession       | Read        | Read (All)    | Overview    | Take Possession| View Summary   | District / Project  |
| Rehabilitation   | Read        | Read (All)    | Overview    | Record Case    | View Summary   | District / Project  |
| Audit Logs       | Full        | Read          | Read (State)| Read (District)| None           | Scope Filtered      |

---

## K. Workflow State Engine Matrix

```
Draft ───────────────► Submitted ──────────────► DistrictVerification ────────► StateReview ────────► Approved
                           │                            │                            │
                           ▼                            ▼                            ▼
                      (Cancelled)              ReturnedForCorrection              Rejected
                                                        │
                                                        v
                                                 (Draft / Resubmit)
```

| Current State | Target State | Allowed Role | Mandatory Requirements |
|---------------|--------------|--------------|------------------------|
| `Draft` | `Submitted` | ProjectAgency | Complete land requirement, documents, cost estimates |
| `Submitted` | `DistrictVerification` | System / DistrictAdmin | Automatic routing based on `district_id` |
| `DistrictVerification` | `StateReview` | DistrictAdmin | Field verification report uploaded & verified |
| `DistrictVerification` | `ReturnedForCorrection` | DistrictAdmin | Rejection comments mandatory |
| `StateReview` | `Approved` | StateAdmin | Financial & Administrative sanction documents attached |
| `StateReview` | `Rejected` | StateAdmin | State committee resolution attached |

---

## L. End-to-End Cross-Role Data Flow Example

```
 [1. Project Agency]       [2. District Admin]       [3. State Admin]        [4. Central Admin / All]
Creates Proposal P-1024 ──► Receives P-1024 in ──► Receives P-1024 in ────► Real-time Dashboard Update
State: DRAFT                Verification Queue      State Review Queue       State: APPROVED
                            Verifies Land Parcels    Approves Proposal        Triggers Acquisition Case
                            State: DIST_VERIFIED     State: APPROVED          - Parcels Notified
                                                                              - Compensation Initiated
```

---

## M. Phase-0 Implementation Roadmap

1. **Phase 0.1**: Workspace Setup & Solution Initialization (.NET 8 Clean Architecture + Angular 19).
2. **Phase 0.2**: Database Schema Execution & Seeding (Geography, Organizations, Roles, Users, Mock Projects & Parcels).
3. **Phase 0.3**: Backend CQRS Implementation & JWT Auth Middleware.
4. **Phase 0.4**: Angular Core Setup (Auth, Guards, Interceptors, Shared UI, Layouts).
5. **Phase 0.5**: Vertical Slice 1 - Proposal Creation, District Verification & State Approval Workflow.
6. **Phase 0.6**: Vertical Slice 2 - Interactive Leaflet GIS Land Parcel Visualization.
7. **Phase 0.7**: Vertical Slice 3 - Compensation, Possession & R&R Tracking Modules.
8. **Phase 0.8**: Role-Based Dashboards & Audit Logging.
