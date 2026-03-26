# 📋 Sigex Document Signing & Archival Guide

**Date:** 2026-03-26  
**Status:** Production Ready  
**Integration:** Sigex.kz via Gateway

---

## 🎯 Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PickPoint OS                             │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Frontend   │─────▶│  SigexService │─────▶│  Backend │ │
│  │  (React)     │      │   (TypeScript)│      │  (Node)  │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Sigex Gateway                             │
│              (sigex-gateway service)                        │
│                                                             │
│  Proxies requests to sigex.kz with proper authentication   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Sigex.kz                                 │
│              (National eGov Platform)                       │
│                                                             │
│  - Document registration                                    │
│  - eGov Mobile/Business QR signing                         │
│  - CMS signature verification                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📄 Document Lifecycle

### Phase 1: Generation

```javascript
// 1. Generate HTML document (backend)
POST /api/documents/generate
{
  employeeId: "...",
  type: "contract"
}

// Response: { document: {...}, content: "<html>..." }
```

**Storage:**
- HTML saved to S3 (Cloudflare R2)
- Path: `documents/{employeeId}/{type}_{timestamp}.html`
- Database record in `documents` table

### Phase 2: Registration in Sigex

```typescript
// 2. Register document in Sigex
const sigexDoc = await SigexService.registerDocument({
  description: "Трудовой договор №001/26",
  nameRu: "Трудовой договор.pdf",
  nameKz: "Еңбек шарты.pdf",
  nameEn: "Employment Contract.pdf"
});

// Returns: { documentId: "abc123", ... }
```

**Current Issue:** ⚠️ Documents are NOT registered in Sigex before signing!

### Phase 3: QR Signing (Current Implementation)

```typescript
// 3. Register QR signing
const qrRes = await SigexService.registerQrSigning(
  "Подписание: Трудовой договор"
);

// Returns: { operationId, qrCode, eGovMobileLaunchLink }

// 4. Send data (long-polling)
await SigexService.sendQrData(
  qrRes.operationId,
  qrRes.operationId, // Currently sending operationId as data
  "Подписание документа"
);

// 5. Poll for status
const status = await SigexService.checkQrStatus(qrRes.operationId);
// Returns: { status: 'done', signatures: ['...cms data...'] }
```

### Phase 4: Save Signature

```javascript
// 6. Save to database
POST /api/documents/:id/sign
{
  signature: "CMS_BASE64_DATA",
  signType: "cms"
}

// Updates: documents.status = 'signed', signed_at = NOW()
```

---

## 🐛 Current Problems

### 1. Documents Not Pre-Registered

**Problem:** Documents are signed as raw strings, not as actual PDF/HTML files.

**Impact:**
- Sigex doesn't have the actual document content
- Can't verify document integrity
- No archival in Sigex

**Current Flow:**
```
User scans QR → Signs operationId string → CMS returned
```

**Should Be:**
```
Upload PDF to Sigex → Get documentId → Sign documentId → CMS returned
```

### 2. No Archival Strategy

**Problem:** Signed documents stored only in S3, no backup.

**Current Storage:**
- S3 (Cloudflare R2): HTML files
- Database: `documents` table with `scan_url`
- Sigex: Only signatures (if registered)

### 3. Signature Not Linked to Document

**Problem:** `signDocument()` API doesn't save the actual CMS signature.

**Current Code:**
```javascript
// parser/src/routes/documents.js
router.post('/documents/:id/sign', async (req, res) => {
    const { signature, signType } = req.body; // ❌ Not used!
    
    await query(`
        UPDATE documents
        SET status = 'signed', signed_at = NOW()
        WHERE id = $1
    `, [id]);
});
```

**Should Be:**
```javascript
await query(`
    UPDATE documents
    SET status = 'signed',
        signed_at = NOW(),
        signature_cms = $2,  -- Save CMS signature
        sigex_document_id = $3 -- Save Sigex document ID
    WHERE id = $1
`, [id, signature, sigexDocId]);
```

---

## ✅ Recommended Solution

### Step 1: Pre-Register Document in Sigex

```typescript
// When generating document
async function generateAndRegisterDocument(employeeId: string, type: string) {
    // 1. Generate HTML
    const htmlContent = generateTemplate(type, employeeData);
    
    // 2. Save to S3
    const s3Key = `documents/${employeeId}/${type}_${Date.now()}.html`;
    await storageService.uploadFile(htmlContent, 'text/html', s3Key);
    
    // 3. Convert to PDF (optional but recommended)
    const pdfBuffer = await pdfService.generateFromHtml(htmlContent);
    
    // 4. Register in Sigex
    const sigexDoc = await SigexService.registerDocument({
        description: `Трудовой договор №${contractNumber}`,
        nameRu: "Трудовой договор.pdf",
        nameKz: "Еңбек шарты.pdf",
        nameEn: "Employment Contract.pdf"
    });
    
    // 5. Upload PDF to Sigex
    await SigexService.addDocumentData(sigexDoc.documentId, pdfBuffer);
    
    // 6. Save to database
    await query(`
        INSERT INTO documents (employee_id, type, status, scan_url, sigex_document_id)
        VALUES ($1, $2, 'draft', $3, $4)
    `, [employeeId, type, s3Key, sigexDoc.documentId]);
    
    return { document, sigexDoc };
}
```

### Step 2: Sign Pre-Registered Document

```typescript
// In SigexSignModal.tsx
const startSigningProcess = async () => {
    // Use pre-registered document ID
    const qrRes = await SigexService.registerQrSigningWithDocument(
        preRegisteredDocumentId, // ✅ Sigex document ID
        "Подписание: Трудовой договор"
    );
    
    // Send actual document data
    await SigexService.sendQrData(
        qrRes.operationId,
        actualDocumentBase64, // ✅ Real document content
        "Трудовой договор"
    );
    
    // Poll for signature
    const status = await SigexService.checkQrStatus(qrRes.operationId);
    
    // Save signature
    await finalizeSignature(status.signatures[0]);
};
```

### Step 3: Save Signature Properly

```javascript
// parser/src/routes/documents.js
router.post('/documents/:id/sign', async (req, res) => {
    const { signature, signType, sigex_document_id } = req.body;
    
    await query(`
        UPDATE documents
        SET status = 'signed',
            signed_at = NOW(),
            signature_cms = $2,
            sigex_document_id = $3,
            external_id = $4
        WHERE id = $1
    `, [id, signature, sigex_document_id, `SIGEX-${Date.now()}`]);
    
    // Log activity
    await logActivity({
        employeeId,
        actionType: 'document_signed',
        actionCategory: 'document',
        title: 'Документ подписан через Sigex',
        metadata: { sigex_document_id, signType }
    });
});
```

---

## 🗄️ Archival Strategy

### Database Schema Updates

```sql
-- Add Sigex tracking columns
ALTER TABLE documents
ADD COLUMN sigex_document_id VARCHAR(100),
ADD COLUMN signature_cms TEXT,
ADD COLUMN signature_xml TEXT,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN archive_location VARCHAR(255);

-- Create archival log table
CREATE TABLE document_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archive_type VARCHAR(50), -- 'sigex', 's3', 'local'
    archive_path VARCHAR(500),
    checksum_sha256 VARCHAR(64),
    metadata JSONB
);

-- Index for fast lookups
CREATE INDEX idx_documents_sigex_id ON documents(sigex_document_id);
CREATE INDEX idx_archives_document ON document_archives(document_id);
```

### Archival Workflow

```
1. Document Generated
   ↓
2. Saved to S3 (Primary Storage)
   ↓
3. Registered in Sigex (Legal Signing)
   ↓
4. Signed via eGov Mobile
   ↓
5. CMS Signature Saved to DB
   ↓
6. PDF + Signature Archived to S3
   ↓
7. Monthly Backup to Cold Storage
```

### Storage Locations

| Storage | Purpose | Retention |
|---------|---------|-----------|
| **S3 (R2)** | Active documents | 5 years |
| **Database** | Metadata, signatures | 10 years |
| **Sigex** | Legal signatures | Per Sigex policy |
| **Cold Storage** | Archived documents | 25 years |

---

## 🔧 Implementation Plan

### Phase 1: Fix Signature Saving (1 day)

- [ ] Add `signature_cms` column to `documents` table
- [ ] Update `/documents/:id/sign` to save CMS signature
- [ ] Test with existing signed documents

### Phase 2: Pre-Register Documents (2 days)

- [ ] Update document generation to register in Sigex
- [ ] Upload PDF to Sigex after generation
- [ ] Save `sigex_document_id` in database
- [ ] Update `SigexSignModal` to use pre-registered ID

### Phase 3: Archival System (2 days)

- [ ] Create `document_archives` table
- [ ] Implement archival on document sign
- [ ] Add monthly backup job
- [ ] Create archival report

### Phase 4: Verification (1 day)

- [ ] Test full workflow: Generate → Register → Sign → Archive
- [ ] Verify signatures in Sigex
- [ ] Test document retrieval from archive

---

## 📊 Current vs Recommended Flow

### Current (Broken)

```
Generate HTML → Save to S3 → Show QR → Sign operationId → Save status only
```

**Issues:**
- ❌ No document in Sigex
- ❌ Signing operationId string, not document
- ❌ Signature not saved
- ❌ No archival

### Recommended (Fixed)

```
Generate HTML → Convert to PDF → Register in Sigex → Upload PDF → 
Show QR → Sign document → Save CMS signature → Archive to S3
```

**Benefits:**
- ✅ Document registered in Sigex
- ✅ Signing actual document content
- ✅ Signature saved in DB
- ✅ Full archival trail

---

## 🎯 Quick Start

### 1. Update Database

```sql
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS sigex_document_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS signature_cms TEXT;
```

### 2. Update Document Generation

```javascript
// parser/src/routes/documents.js
const docResult = await query(`
    INSERT INTO documents (employee_id, type, status, scan_url, sigex_document_id)
    VALUES ($1, $2, 'draft', $3, $4)
    RETURNING *
`, [employeeId, type, htmlKey, sigexDoc.documentId]);
```

### 3. Update Signing

```typescript
// SigexSignModal.tsx
const qrRes = await SigexService.registerQrSigningWithDocument(
    preRegisteredDocumentId, // Pass sigex_document_id
    `Подписание: ${documentTitle}`
);
```

### 4. Save Signature

```javascript
// parser/src/routes/documents.js
router.post('/documents/:id/sign', async (req, res) => {
    const { signature } = req.body;
    
    await query(`
        UPDATE documents
        SET status = 'signed',
            signed_at = NOW(),
            signature_cms = $2
        WHERE id = $1
    `, [id, signature]);
});
```

---

**Ready to implement!** 🚀

