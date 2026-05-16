# 📋 PickPoint OS - Project Context & Roadmap

**Date:** 2026-03-27  
**Status:** Production Ready (with known issues)  
**Last Updated:** 2026-03-27

---

## 🎯 Executive Summary

PickPoint OS - HR management system for Wildberries pickup points. Manages employee onboarding, document generation, and remote signing via Sigex (eGov).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PickPoint OS                             │
│                                                             │
│  Frontend: React + TypeScript + Vite                        │
│  Backend: Node.js + Express + PostgreSQL                    │
│  Storage: Cloudflare R2 (S3-compatible)                     │
│  Deployment: Railway.app                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Sigex Gateway                              │
│              (gateway.pvz.kz)                               │
│              195.49.215.116 (CentOS 9)                      │
│                                                             │
│  Proxies to: sigex.kz/api (National eGov Platform)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Current Status

### ✅ Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Employee Management** | ✅ Production | CRUD operations, status tracking |
| **Document Generation** | ✅ Production | 8 document types (contract, orders, certificates) |
| **Document Upload** | ✅ Production | S3 storage, type selection |
| **Activity Logging** | ✅ Production | Full audit trail |
| **Employer Linkage** | ✅ Production | PVZ → Employer auto-mapping |
| **Remote Signing Links** | ✅ Production | Shareable links for employees |
| **Revision Comments** | ✅ Production | Mandatory comments for revisions |
| **Employee History** | ✅ Production | Timeline view |

### ⚠️ Known Issues

| Issue | Priority | Status | Workaround |
|-------|----------|--------|------------|
| **Sigex Gateway** | 🟢 OK | 4 CPU / 4 GB RAM / 80 GB Disk | Monitor memory usage |
| **Additional Documents Not Generating** | 🟡 MEDIUM | Needs fix | Manual template check |
| **ID Card Inputs Missing** | 🟡 MEDIUM | Needs implementation | Manual data entry later |

---

## 🔧 Technical Debt & TODOs

### Critical (Do Now)

1. **Fix Additional Document Generation**
   - Issue: Templates for vacation/termination not working
   - Location: `parser/src/routes/documents.js`
   - Fix: Check template imports and type handling

2. **Add ID Card Fields to Onboarding**
   - Issue: Missing inputs for удостоверение личности
   - Location: `src/components/hr/new-employee/`
   - Fix: Add form fields, update validation

3. **Gateway Configuration**
   - Status: 4 CPU / 4 GB RAM / 80 GB Disk
   - Location: gateway.pvz.kz (195.49.215.116)
   - Note: NODE_OPTIONS can be increased to --max-old-space-size=2048

### Important (This Week)

4. **Test Remote Signing Flow**
   - Generate signing link
   - Send to employee
   - Verify QR signing works

5. **Add Document Preview for Uploaded Files**
   - Currently only works for generated documents
   - Need to fetch from S3 and display

6. **Improve Error Handling**
   - Better user-facing messages
   - Retry logic for Sigex timeouts

### Nice to Have (Next Sprint)

7. **Email Notifications**
   - Send signing links via email
   - Status change notifications

8. **Bulk Operations**
   - Generate documents for multiple employees
   - Bulk status updates

9. **Document Templates Editor**
   - HR can customize templates
   - Version control for templates

---

## 📁 File Structure

```
/Users/mac/Documents/AlemLab-pickpointoperations/
├── src/                          # Frontend (React)
│   ├── components/hr/
│   │   ├── DocumentsList.tsx     # Document management UI
│   │   ├── SigexSignModal.tsx    # QR signing modal
│   │   ├── profile/
│   │   │   ├── HistoryTab.tsx    # Activity timeline
│   │   │   └── OnboardingTab.tsx # Checklist
│   │   └── new-employee/
│   │       └── *.tsx             # Onboarding forms
│   ├── api/hr.ts                 # API client
│   └── services/sigex.ts         # Sigex integration
│
├── parser/src/                   # Backend (Node.js)
│   ├── routes/
│   │   ├── documents.js          # Document endpoints
│   │   └── hr.js                 # HR endpoints
│   ├── lib/
│   │   ├── activityLogger.js     # Activity logging
│   │   └── db.js                 # Database connection
│   └── services/
│       └── templates.js          # Document templates
│
├── database/migrations/
│   ├── 007_add_employer_to_pvz_and_employees.sql
│   ├── 008_import_pvz_from_csv.sql
│   ├── 009_add_contract_termination_process.sql
│   ├── 010_add_employee_activity_logs.sql
│   ├── 011_add_sigex_columns_to_documents.sql
│   └── 012_add_document_signing_links.sql
│
└── docs/
    ├── GATEWAY_OPS_MANUAL.md     # Gateway operations
    ├── SIGEX_DOCUMENT_SIGNING_GUIDE.md
    ├── HR_TESTING_REPORT.md
    └── PROJECT_CONTEXT_AND_ROADMAP.md (this file)
```

---

## 🔑 Key Endpoints

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/generate` | Generate document |
| POST | `/api/documents/upload` | Upload scan |
| GET | `/api/documents/:id/content` | Get content |
| POST | `/api/documents/:id/sign` | Sign document |
| DELETE | `/api/documents/:id` | Delete document |
| POST | `/api/documents/:id/signing-link` | Generate remote signing link |
| GET | `/sign/:token` | Public signing page |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees |
| POST | `/api/employees` | Create employee |
| PATCH | `/api/employees/:id/status` | Update status |
| GET | `/api/employees/:id/transfers` | Get transfer history |
| GET | `/api/employees/:id/activity` | Get activity log |

---

## 🗄️ Database Schema

### Key Tables

**employees**
- id, iin, full_name, phone, email
- main_pvz_id, employer_id (auto-updated)
- status (new, review, revision, signing, active, fired)
- rejection_reason (revision comment)

**documents**
- id, employee_id, type, status
- scan_url (S3 key)
- sigex_document_id, signature_cms (NEW)

**document_signing_links** (NEW)
- id, document_id, employee_id
- token (unique 64-char)
- expires_at, used_at, access_count

**employee_activity_logs** (NEW)
- id, employee_id, action_type
- title, description, metadata
- created_at

**pvz_points**
- id, name, address, wb_id
- employer_id (linked to employers table)

**employers**
- id, name_full, name_short
- bin/iin, director_name, bank details

---

## 🔐 Environment Variables

### Frontend (.env.production)

```bash
VITE_API_URL=https://pickpointos-production.up.railway.app
VITE_SIGEX_GATEWAY_URL=https://gateway.pvz.kz
```

### Backend (Railway)

```bash
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_ENDPOINT=https://8c40e3d415db0d9f25ae472273a44fe5.r2.cloudflarestorage.com
AWS_BUCKET_NAME=pickpointos
FRONTEND_URL=https://pickpointos-production.up.railway.app
```

### Gateway (gateway.pvz.kz)

```bash
PORT=8080
SIGEX_API_URL=https://sigex.kz/api
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=512
```

---

## 📝 Recent Changes (Last 7 Days)

### 2026-03-27

- ✅ Migration 012: document_signing_links table
- ✅ Remote signing links feature
- ✅ Share button in DocumentsList
- ✅ GATEWAY_OPS_MANUAL.md created
- ✅ Gateway upgraded: 4 CPU / 4 GB RAM / 80 GB SSD

### 2026-03-26

- ✅ Migration 011: sigex_document_id, signature_cms columns
- ✅ Activity logging implementation
- ✅ HistoryTab component
- ✅ Mandatory revision comments
- ✅ TypeScript fixes

### 2026-03-25

- ✅ Migration 007-010: Employer linkage, activity logs
- ✅ Employer requisites from CSV
- ✅ Document preview fixes
- ✅ UI redesign (Swiss Modernism)

---

## 🎯 Next Steps (Priority Order)

### Immediate (Today)

1. **Create context preservation document** ← THIS FILE
2. **Fix additional document generation**
3. **Add ID card inputs to onboarding**

### This Week

4. **Test remote signing flow end-to-end**
5. **Monitor gateway memory usage (4 GB sufficient)**
6. **Consider increasing NODE_OPTIONS to 2048 MB**

### Next Week

7. **Email notifications for signing links**
8. **Document preview for uploaded files**
9. **Bulk document generation**

---

## 📞 Team & Contacts

| Role | Contact | Notes |
|------|---------|-------|
| **Developer** | AI Assistant | This chat |
| **System Admin** | [You] | SSH access to gateway |
| **HR Team** | madina.kimadi.1994@gmail.com | End users |
| **Sigex Support** | support@sigex.kz | API issues |

---

## 🚀 Deployment Checklist

### Pre-Deploy

- [ ] Run migrations (`011`, `012`)
- [ ] Test locally
- [ ] Build passes (`npm run build`)
- [ ] Environment variables set

### Deploy

- [ ] Push to main branch
- [ ] Railway auto-deploys
- [ ] Monitor build logs
- [ ] Check health endpoint

### Post-Deploy

- [ ] Test document generation
- [ ] Test signing links
- [ ] Check activity logs
- [ ] Monitor errors

---

## 📊 Metrics & Monitoring

### Key Metrics

- **Documents Generated:** Track per day/week
- **Signing Link Usage:** Conversion rate
- **Activity Events:** Audit trail completeness
- **Gateway Uptime:** Should be > 99%

### Health Checks

```bash
# Backend
curl https://pickpointos-production.up.railway.app/health

# Gateway
curl https://gateway.pvz.kz/health

# Database
psql $DATABASE_URL -c "SELECT 1"
```

---

## 🐛 Troubleshooting Guide

### Document Not Generating

1. Check template exists in `parser/src/services/templates.js`
2. Verify document type in `DOCUMENT_TYPES` constant
3. Check backend logs for errors

### Signing Link Not Working

1. Verify token is valid (not expired)
2. Check `document_signing_links` table
3. Test Sigex Gateway health

### Gateway Timeout

1. SSH to gateway.pvz.kz
2. Check `systemctl status sigex-gateway`
3. Review logs: `journalctl -u sigex-gateway`
4. Restart if needed: `systemctl restart sigex-gateway`

---

**Document Version:** 1.0  
**Created:** 2026-03-27  
**Maintained By:** Development Team  
**Next Review:** 2026-04-03
