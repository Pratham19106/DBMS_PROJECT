# Backend API Documentation (Frontend Integration Guide)

This document describes the current backend API implemented in `backend/src`.
It is written for frontend integration and reflects current runtime behavior, including inconsistencies and known issues.

## 1. Quick Overview

- Runtime: Express (`src/app.js`)
- DB: PostgreSQL via `pg` (`src/db/db.js`)
- Base URL (local): `http://localhost:3000`
- Default port: `process.env.PORT` or `3000`
- Request body format: JSON
- Error format (global):

```json
{
  "msg": "Error message"
}
```

## 2. Authentication Model

### JWT endpoints

- `POST /register`
- `POST /login`

`/login` returns a JWT token in response body.

### Important current behavior

- There is an `authMiddleware` in `src/middlewares/authMiddleware.js` that expects:
  - `Authorization: Bearer <token>`
- However, most routes currently do **not** use auth middleware.
- So most API routes are currently public unless this is changed in routing.

## 3. Common Integration Rules

### 3.1 Response style

- Success payload keys vary by endpoint (`user`, `users`, `vendor`, `vendors`, `bill`, `bills`, etc.).
- List endpoints return `200` with empty arrays when no rows are found.

### 3.2 Error handling

- Backend sends `{ "msg": "..." }` for errors.
- Use `msg` as the error message in frontend toasts/UI.

### 3.3 Field naming caveats

Some request/response fields include backend typos and must be sent exactly:

- `bussinessName` (profile request body; double s)
- `supplied_ammount` (bill commodity field; double m)

## 4. Route Index

### Auth

- `POST /register`
- `POST /login`

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

### User Profiles

- `GET /users/profiles`
- `GET /users/:id/profiles`
- `POST /users/:id/profiles`
- `PUT /users/:id/profiles`

### Vendors

- `GET /vendors`
- `GET /users/:userId/vendors`
- `GET /users/:userId/vendors/:id`
- `POST /users/:userId/vendors`
- `PUT /users/:userId/vendors/:id`
- `DELETE /users/:userId/vendors/:id`

### Commodities

- `GET /users/:userId/commodities`
- `GET /users/:userId/commodities/:id`
- `POST /users/:userId/commodities`
- `PUT /users/:userId/commodities/:id`
- `DELETE /users/:userId/commodities/:id`

### Vendor <-> Commodity Links

- `GET /users/:userId/vendors/:vendorId/commodities`
- `GET /users/:userId/commodities/:commodityId/vendors`
- `GET /users/:userId/commodities/:commodityId/vendor-suggestion`
- `POST /users/:userId/vendors/:vendorId/commodities`
- `DELETE /users/:userId/vendors/:vendorId/commodities/:commodityId`

### Bills

- `GET /users/:userId/bills`
- `GET /users/:userId/bills/:id`
- `GET /users/:userId/vendors/:vendorId/bills`
- `POST /users/:userId/bills`
- `PUT /users/:userId/bills/:id`
- `DELETE /users/:userId/bills/:id`

### Payment Logs

- `GET /users/:userId/payment-logs`
- `GET /users/:userId/vendors/:vendorId/payment-logs`
- `GET /users/:userId/bills/:billId/payment-logs`
- `GET /users/:userId/payment-suggestion`
- `POST /users/:userId/payment-logs`

### Purchase

- `GET /users/:userId/purchase` (currently placeholder/non-functional)

## 5. Detailed API Reference

## 5.1 Auth

### POST /register
Create a user account.

Request body:

```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "secret123"
}
```

Success `201`:

```json
{
  "success": true,
  "msg": "User Added Successfully",
  "user": {
    "id": 1,
    "name": "John",
    "email": "john@example.com"
  }
}
```

Notes:
- Password is hashed here using `bcryptjs`.
- Duplicate check is by `email`.

Possible errors:
- `409` user already registered
- `400` bad request

---

### POST /login
Login and return JWT.

Request body:

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "User logined in successfully",
  "token": "<jwt>"
}
```

Possible errors:
- `400` user is not registered
- `400` invalid credential

## 5.2 Users

### GET /users
Get all users.

Success `200`:

```json
{
  "users": [
    {
      "id": 1,
      "name": "John",
      "email": "john@example.com"
    }
  ]
}
```

Error:
- No error for empty list; response is `200` with `users: []`

---

### GET /users/:id
Get one user.

Success `200`:

```json
{
  "user": {
    "id": 1,
    "name": "John",
    "email": "john@example.com"
  }
}
```

Error:
- `404` user not found

---

### POST /users
Create user directly.

Request body:

```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "secret123"
}
```

Success `201` same structure as `/register`.

Possible errors:
- `409` email already exists
- `400` bad request

Important:
- This path hashes password using `bcryptjs` before insert.

---

### PUT /users/:id
Update user fields.

Request body (all optional):

```json
{
  "name": "John Updated",
  "email": "john2@example.com",
  "password": "newPass"
}
```

Controller responds with status `200` and includes the updated `user` object.

---

### DELETE /users/:id
Delete user.

Success `200`:

```json
{
  "success": true,
  "message": "User deleted successfully.",
  "deletedUser": {
    "id": 1
  }
}
```

Error:
- `404` user does not exist

## 5.3 User Profiles

### GET /users/profiles
Get all profiles.

Success `200`:

```json
{
  "userProfiles": [
    {
      "user_id": 1,
      "business_name": "My Cafe",
      "phone_number": "9999999999",
      "address": "Main Road"
    }
  ]
}
```

---

### GET /users/:id/profiles
Get profile for user.

Success `200`:

```json
{
  "profile": {
    "user_id": 1,
    "business_name": "My Cafe",
    "phone_number": "9999999999",
    "address": "Main Road"
  }
}
```

Errors:
- `404` no such user exists

---

### POST /users/:id/profiles
Create profile.

Request body (exact current names):

```json
{
  "bussinessName": "My Cafe",
  "phoneNumber": "9999999999",
  "address": "Main Road"
}
```

Success `201`:

```json
{
  "success": true,
  "profile": {
    "user_id": 1,
    "business_name": "My Cafe",
    "phone_number": "9999999999",
    "address": "Main Road"
  }
}
```

Errors:
- `404` no such user exists
- `400` bad request

---

### PUT /users/:id/profiles
Update profile (partial supported).

Request body (same field names as create):

```json
{
  "bussinessName": "New Name",
  "phoneNumber": "8888888888",
  "address": "New Address"
}
```

Success `200`:

```json
{
  "success": true,
  "msg": "Updated Successfully",
  "profile": {
    "user_id": 1,
    "business_name": "New Name",
    "phone_number": "8888888888",
    "address": "New Address"
  }
}
```

Errors:
- `404` no such user exists
- `404` profile not found

## 5.4 Vendors

### GET /vendors
Get all vendors globally.

Success `200`:

```json
{
  "vendors": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Vendor A",
      "phone_number": "9000000000"
    }
  ]
}
```

Error:
- `404` no vendors found

---

### GET /users/:userId/vendors
Get vendors for user.

Success `200`: `{ "vendors": [...] }`

Error:
- `404` no vendors found for this user

---

### GET /users/:userId/vendors/:id
Get vendor by id.

Success `200`: `{ "vendor": { ... } }`

Error:
- `404` vendor not found

---

### POST /users/:userId/vendors
Create vendor.

Request body:

```json
{
  "name": "Vendor A",
  "phone_number": "9000000000"
}
```

Success `201`:

```json
{
  "success": true,
  "msg": "Vendor Added Successfully",
  "vendor": {
    "id": 1,
    "user_id": 1,
    "name": "Vendor A",
    "phone_number": "9000000000"
  }
}
```

Errors:
- `400` missing required fields
- `400` user does not exist

---

### PUT /users/:userId/vendors/:id
Update vendor (partial supported).

Request body:

```json
{
  "name": "Vendor A+",
  "phone_number": "9111111111"
}
```

Success `200`:

```json
{
  "success": true,
  "msg": "Vendor Updated Successfully",
  "vendor": { "id": 1 }
}
```

Error:
- `404` vendor not found

---

### DELETE /users/:userId/vendors/:id
Delete vendor.

Success `200`:

```json
{
  "success": true,
  "msg": "Vendor Deleted Successfully",
  "vendor": { "id": 1 }
}
```

Error:
- `404` vendor not found

## 5.5 Commodities

### GET /users/:userId/commodities
Get all commodities for user.

Success `200`:

```json
{
  "commodities": [
    {
      "id": 1,
      "user_id": 1,
      "name": "rice",
      "quantity": 25,
      "unit": "kg"
    }
  ]
}
```

Error:
- `404` no commodities found for this user

---

### GET /users/:userId/commodities/:id
Get commodity by id.

Success `200`: `{ "commodity": { ... } }`

Error:
- `404` commodity not found

---

### POST /users/:userId/commodities
Create commodity.

Request body:

```json
{
  "name": "Rice",
  "quantity": 25,
  "unit": "kg"
}
```

Success `201`:

```json
{
  "success": true,
  "commodity": {
    "id": 1,
    "name": "rice",
    "quantity": 25,
    "unit": "kg",
    "user_id": 1
  }
}
```

Notes:
- Name is normalized to lowercase.
- Duplicate check is by `(name, user_id)`.

Error:
- `409` commodity already exists

---

### PUT /users/:userId/commodities/:id
Update commodity quantity.

Request body:

```json
{
  "quantity": 50
}
```

Intended success `200`:

```json
{
  "success": true,
  "msg": "Commodity updated successfully",
  "commodity": { "id": 1, "quantity": 50 }
}
```

Known issue:
- Current controller uses `updateCommodityQuery` but does not import it, causing runtime failure.

---

### DELETE /users/:userId/commodities/:id
Delete commodity.

Success `200`:

```json
{
  "success": true,
  "msg": "Commodity deleted successfully"
}
```

Error:
- `404` commodity not found

## 5.6 Vendor-Commodity Linking

### GET /users/:userId/vendors/:vendorId/commodities
Get commodities linked to vendor.

Success `200`: `{ "commodities": [...] }`

Error:
- `404` no commodities found for this vendor

---

### GET /users/:userId/commodities/:commodityId/vendors
Get vendors linked to commodity.

Success `200`: `{ "vendors": [...] }`

Error:
- `404` no vendors found for this commodity

---

### GET /users/:userId/commodities/:commodityId/vendor-suggestion
Suggest vendor (least pending amount first).

Success `200`:

```json
{
  "suggested_vendor": {
    "id": 1,
    "name": "Vendor A",
    "phone_number": "9000000000",
    "pending_amount": "1200"
  },
  "all_vendors": [
    {
      "id": 1,
      "name": "Vendor A",
      "phone_number": "9000000000",
      "pending_amount": "1200"
    }
  ]
}
```

Error:
- `404` no vendors found for this commodity

---

### POST /users/:userId/vendors/:vendorId/commodities
Link commodity to vendor.

Request body:

```json
{
  "commodity_id": 10
}
```

Success `201`:

```json
{
  "success": true,
  "msg": "Commodity linked to vendor successfully"
}
```

Errors:
- `400` commodity_id required
- `400` vendor or commodity does not exist
- `409` commodity already linked

---

### DELETE /users/:userId/vendors/:vendorId/commodities/:commodityId
Unlink commodity from vendor.

Success `200`:

```json
{
  "success": true,
  "msg": "Commodity unlinked from vendor successfully"
}
```

Error:
- `404` link not found

## 5.7 Bills

### Bill status rules

Backend computes status using paid and total:

- `paid_amount <= 0` -> `unpaid`
- `paid_amount >= total_amount` -> `paid`
- else -> `partial`

### GET /users/:userId/bills
Get bills for user.

Success `200`: `{ "bills": [...] }`

Error:
- `404` no bills found for this user

---

### GET /users/:userId/bills/:id
Get bill with items.

Success `200`:

```json
{
  "bill": {
    "id": 15,
    "vendor_id": 2,
    "user_id": 1,
    "total_amount": 3000,
    "paid_amount": 1000,
    "status": "partial",
    "bill_url": null,
    "items": [
      {
        "commodity_id": 10,
        "name": "rice",
        "supplied_ammount": 25,
        "unit": "kg",
        "cost": 1200
      }
    ]
  }
}
```

Error:
- `404` bill not found

---

### GET /users/:userId/vendors/:vendorId/bills
Get bills for one vendor and user.

Success `200`: `{ "bills": [...] }`

Error:
- `404` no bills found for this vendor

---

### POST /users/:userId/bills
Create bill and bill items (transactional).

Request body:

```json
{
  "vendor_id": 2,
  "total_amount": 3000,
  "paid_amount": 1000,
  "bill_url": "https://...",
  "commodities": [
    {
      "commodity_id": 10,
      "supplied_ammount": 25,
      "unit": "kg",
      "cost": 1200,
      "name": "rice"
    }
  ]
}
```

Success `201`:

```json
{
  "success": true,
  "msg": "Bill Added Successfully",
  "bill": {
    "id": 15,
    "status": "partial"
  },
  "items": [
    {
      "bill_id": 15,
      "commodity_id": 10,
      "supplied_ammount": 25,
      "unit": "kg",
      "cost": 1200,
      "name": "rice"
    }
  ]
}
```

Notes:
- If `unit` missing in each commodity item, backend defaults unit to `kg`.
- Commodity stock is incremented (`commodities.quantity += supplied_ammount`).

Errors:
- `400` required bill fields missing
- `400` per-item required fields missing
- `400` vendor/user/commodity FK invalid

---

### PUT /users/:userId/bills/:id
Update bill payment and/or URL.

Request body (optional fields):

```json
{
  "paid_amount": 3000,
  "bill_url": "https://new-url"
}
```

Success `200`:

```json
{
  "success": true,
  "msg": "Bill Updated Successfully",
  "bill": {
    "id": 15,
    "status": "paid"
  }
}
```

Error:
- `404` bill not found

---

### DELETE /users/:userId/bills/:id
Delete bill.

Success `200`:

```json
{
  "success": true,
  "msg": "Bill deleted successfully"
}
```

Error:
- `404` bill not found

## 5.8 Payment Logs

### GET /users/:userId/payment-logs
Get all payment logs for user.

Success `200`:

```json
{
  "payment_logs": [
    {
      "id": 1,
      "user_id": 1,
      "vendor_id": 2,
      "bill_id": 15,
      "amount_paid": 500,
      "payment_mode": "cash"
    }
  ]
}
```

Error:
- `404` none found

---

### GET /users/:userId/vendors/:vendorId/payment-logs
Get payment logs for one vendor.

Success `200`: `{ "payment_logs": [...] }`

Error:
- `404` none found

---

### GET /users/:userId/bills/:billId/payment-logs
Get payment logs for one bill.

Success `200`: `{ "payment_logs": [...] }`

Error:
- `404` none found

---

### POST /users/:userId/payment-logs
Add payment log and update bill (transactional).

Request body:

```json
{
  "vendor_id": 2,
  "bill_id": 15,
  "amount_paid": 500,
  "payment_mode": "cash"
}
```

Success `201`:

```json
{
  "success": true,
  "msg": "Payment logged successfully",
  "payment_log": {
    "id": 1,
    "bill_id": 15,
    "amount_paid": 500
  },
  "bill": {
    "id": 15,
    "paid_amount": 1500,
    "status": "partial"
  }
}
```

Errors:
- `400` required fields missing
- `404` bill not found
- `400` FK invalid (user/vendor/bill)

---

### GET /users/:userId/payment-suggestion
Payment prioritization suggestion.

Success `200` when pending exists:

```json
{
  "suggested_vendor": {
    "id": 2,
    "name": "Vendor A",
    "phone_number": "9000000000",
    "pending_amount": "3500",
    "oldest_bill_date": "2026-04-01T00:00:00.000Z",
    "unpaid_bill_count": "3"
  },
  "all_pending_vendors": [
    {
      "id": 2,
      "name": "Vendor A",
      "phone_number": "9000000000",
      "pending_amount": "3500",
      "oldest_bill_date": "2026-04-01T00:00:00.000Z",
      "unpaid_bill_count": "3"
    }
  ]
}
```

Success `200` when no pending:

```json
{
  "msg": "No pending payments",
  "vendors": []
}
```

## 5.9 Purchase Route

### GET /users/:userId/purchase
Current status:
- Route exists in `src/routes/purchase.js` but has no handler attached.
- Controller/feature files for purchase are incomplete and contain unresolved code.
- Treat this endpoint as not usable for frontend integration right now.

## 6. Known Backend Issues (Important for Frontend)

1. `PUT /users/:id`
- Update check logic is broken and may return not found incorrectly.

2. `PUT /users/:userId/commodities/:id`
- Uses `updateCommodityQuery` without importing it in controller, causing runtime failure.

3. Empty list behavior
- Many list endpoints return `404` instead of `200` with empty array.

4. Auth enforcement
- JWT middleware exists but currently not applied to most routes.

5. Inconsistent naming/spelling
- `bussinessName`, `supplied_ammount`, and message typos are present in API.

## 7. Frontend Integration Recommendations

1. Centralize API error parsing to read `response.msg`.
2. Handle `404` on list endpoints as an empty-state case.
3. Keep request payload keys exactly as expected (including current typos).
4. Use defensive parsing for numeric strings from SQL aggregates (for suggestion endpoints).
5. Keep auth token storage ready, even though current routes are mostly public.
6. Feature-flag or hide purchase optimization endpoint until backend completes it.

## 8. Suggested Frontend API Client Types (Starter)

```ts
export type ApiError = { msg: string }

export type LoginResponse = {
  success: boolean
  message: string
  token: string
}

export type Vendor = {
  id: number
  user_id: number
  name: string
  phone_number: string
}

export type Commodity = {
  id: number
  user_id: number
  name: string
  quantity: number
  unit: string
}

export type BillItemInput = {
  commodity_id: number
  supplied_ammount: number
  unit?: string
  cost: number
  name: string
}
```

---

If backend behavior changes, update this file first so frontend integration remains aligned.
