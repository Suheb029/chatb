# WhatBot — WhatsApp Business Chatbot Integration Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-v18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Meta Graph API](https://img.shields.io/badge/Meta_Graph_API-v20.0-0668E1.svg)](https://developers.facebook.com/docs/whatsapp/cloud-api)

A modern, full-stack **WhatsApp Business Chatbot Integration & Multi-Agent Dashboard**. WhatBot enables business owners and support teams to manage customer conversations, design automated keyword reply flows, schedule broadcast campaigns, manage FAQ knowledge bases, and monitor automation analytics.

> **Zero Credentials Required for Development**: WhatBot features an integrated **Demo Sandbox Provider** that simulates WhatsApp messaging, keyword rules, and webhooks locally. It is also pre-architected for official **Meta WhatsApp Cloud API (Graph API v20.0)** when you are ready to connect real API keys.

---

## 📸 Key Features & Capabilities

### 1. Dashboard Overview
- **Executive KPI Cards**: Total Conversations, Messages Received, Messages Sent, Active Contacts, Automated Replies, Bot Response Rate (84.5%), and Average First Response Time (1.4s).
- **Interactive Recharts Visualizations**:
  - 7-Day Message Volume area chart (Incoming vs. Bot Automated vs. Agent Handled).
  - Bot vs. Human Resolution ratio donut/pie chart.
  - Query category distribution (Sales, Support, Orders, General).
- **Real-Time Activity Stream**: Live feed of triggered rules, handoffs, and delivered broadcasts.

### 2. WhatsApp-Style Live Chat Inbox
- **Three-Column Interface**: Conversation drawer, WhatsApp-themed chat canvas, and right-hand customer profile panel.
- **Realistic WhatsApp Chat Experience**:
  - Message bubble styling with timestamp and delivery checkmarks (`✓` Sent, `✓✓` Delivered, `✓✓` Read).
  - Filter chats by status: **Open**, **Pending**, or **Resolved**.
  - Assign conversations between **Chatbot** and live human agents (**Sarah Connor**, **Alex Rivera**).
  - Internal agent notes editor with auto-save.
  - Canned quick responses bar for rapid replies.
- **Simulate Customer Action**: Click **"Simulate Customer"** inside any chat to test incoming phrases (e.g., *"What is the price?"*, *"What are your business hours?"*) and observe the bot trigger automated replies in real time.

### 3. Visual Chatbot Builder
- **Visual Workflow Map**: Step-by-step pipeline illustrating how messages flow from trigger → handoff check → business hours validation → keyword rule matching → FAQ lookup → default fallback.
- **Master Bot Toggle**: Instantly enable or pause chatbot operations.
- **Welcome & Fallback Messages**: Customizable greetings and fallback messages.
- **Business Hours Enforcement**: Configure working hours, operating days (Mon-Fri), and automated after-hours responses.
- **Human Agent Handoff**: Define keywords (`agent`, `human`, `representative`) that instantly escalate chats to human agents.

### 4. Automated Keyword Replies
- **Trigger Rule Manager**: Exact match, Contains keyword, Starts with, and Regex patterns.
- **Rule Priorities & Active Toggles**: Enable or disable rules with a single click.
- **Interactive Keyword Tester**: Type test phrases directly in the browser to see which rule matches.

### 5. FAQ Management
- **Categorized Knowledge Base**: General, Pricing, Products, Shipping, Refunds, Support.
- **Accordion Previews**: Interactive question cards with expandable answers and trigger statistics.

### 6. WhatsApp Message Templates (HSM)
- **WhatsApp Template Format**: Header (Text/Media), Body with dynamic `{{1}}`, `{{2}}` parameters, Footer, and CTA/Quick Reply buttons.
- **Live Smartphone Device Mockup**: Real-time rendering inside an iOS/Android WhatsApp phone frame.
- **Meta Status Lifecycle**: Draft, Pending, Approved, Rejected simulator.

### 7. Broadcast Campaigns
- **Targeted Audiences**: Filter contacts by tags (e.g., `VIP`, `Enterprise`, `Lead`).
- **Delivery Analytics**: Real-time tracking of Sent, Delivered (98%), Read Receipts (84%), and Failed counts.
- **Scheduling**: Send immediately or schedule for future dates.

### 8. Analytics & Intelligence
- **24-Hour Traffic Bar Chart**: Hourly distribution of WhatsApp customer traffic.
- **Resolution Progression Chart**: Monthly bot vs. human resolution rate.
- **Leaderboards**: Top triggered bot rules and agent response time metrics.

### 9. WhatsApp API Settings & Meta Cloud API Ready
- **Modular Provider Architecture**: Cleanly separated `DemoWhatsAppProvider` and `MetaCloudApiProvider`.
- **Security First**: Permanent access tokens are masked (`••••••••`), stored safely on the backend, and never logged.
- **Live Connection Test**: Click **"Test Connection"** to verify sandbox status or ping live Meta endpoints.
- **Step-by-Step Meta Setup Guide**: Interactive documentation for connecting real credentials.

### 10. Global Live Chatbot Simulator
- Accessible from any screen via the top-header **"Live Simulator"** button. Chat with the bot in a virtual smartphone modal to test your rules anytime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express.js (ESM), TypeScript (`tsx`) |
| **Database** | MongoDB with Mongoose (with in-memory persistence fallback) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing |
| **WhatsApp Engine** | Meta Graph API v20.0 Provider Interface & Local Sandbox Provider |

---

## 📂 Project Architecture

```
chatb/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                         # MongoDB connection with resilient fallback
│   │   ├── models/
│   │   │   ├── User.ts                       # Admin and Agent auth accounts
│   │   │   ├── Contact.ts                    # WhatsApp customer contacts & tags
│   │   │   ├── Conversation.ts               # Open / Pending / Resolved threads
│   │   │   ├── Message.ts                    # WhatsApp message bubbles & delivery status
│   │   │   ├── AutoReplyRule.ts              # Keyword trigger rules & match types
│   │   │   ├── Faq.ts                        # Categorized FAQ Q&A entries
│   │   │   ├── BotSettings.ts                # Business hours, welcome, fallback, handoff
│   │   │   ├── MessageTemplate.ts            # WhatsApp HSM templates with buttons
│   │   │   ├── Campaign.ts                   # Broadcast campaign delivery metrics
│   │   │   └── ApiConfig.ts                  # WABA ID, Phone ID, masked tokens
│   │   ├── services/
│   │   │   ├── store.ts                      # In-memory store & initial seed dataset
│   │   │   └── whatsapp/
│   │   │       ├── whatsappProvider.interface.ts # Provider contract interface
│   │   │       ├── demoProvider.ts           # Demo sandbox simulation engine
│   │   │       ├── metaCloudApiProvider.ts   # Official Meta Graph API v20.0 provider
│   │   │       ├── providerFactory.ts        # Dynamic provider switcher
│   │   │       └── botEngine.ts              # Core rule & handoff evaluation engine
│   │   ├── controllers/                      # Express REST API controllers
│   │   ├── routes/
│   │   │   └── api.ts                        # Unified API router
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts             # JWT authentication guards
│   │   ├── seed/
│   │   │   └── seedData.ts                   # Sample database seed script
│   │   └── server.ts                         # Express server entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/                       # Sidebar, Header
│   │   │   ├── common/                       # Modal, Badge, Button, Card, EmptyState
│   │   │   └── simulator/                    # Interactive Smartphone Bot Simulator Modal
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx             # Overview metrics & Recharts graphs
│   │   │   ├── LiveChatPage.tsx              # 3-column WhatsApp chat inbox & simulation
│   │   │   ├── ContactsPage.tsx              # Contacts directory, search, CSV export
│   │   │   ├── BotBuilderPage.tsx            # Visual workflow map & bot settings
│   │   │   ├── AutoRepliesPage.tsx           # Keyword rules & instant tester
│   │   │   ├── FaqPage.tsx                   # FAQ knowledge base accordion
│   │   │   ├── TemplatesPage.tsx             # HSM templates & mobile preview
│   │   │   ├── CampaignsPage.tsx             # Broadcast manager & metrics
│   │   │   ├── AnalyticsPage.tsx             # Traffic & resolution intelligence
│   │   │   └── SettingsPage.tsx              # WhatsApp API & Meta connection
│   │   ├── context/                          # AuthContext, ToastContext
│   │   ├── lib/                              # API client (`api.ts`), utilities
│   │   ├── types/                            # TypeScript interfaces
│   │   └── App.tsx                           # Root application switcher
│   └── vite.config.ts                        # Dev server & /api proxy to port 5000
│
├── package.json                              # Root workspace runner scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+
- *(Optional)* **MongoDB** running locally on port 27017 (an automatic in-memory fallback will activate if MongoDB is offline, so the dashboard always works).

---

### Step 1: Install Dependencies

From the repository root:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Configure Environment Variables

In the `backend/` folder, copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```

Default contents of `backend/.env`:
```env
PORT=5000
WHATSAPP_MODE=demo
MONGODB_URI=mongodb://127.0.0.1:27017/whatsapp_chatbot
JWT_SECRET=whatbot_super_secret_jwt_key_development_2026
META_VERIFY_TOKEN=whatbot_secure_token
```

---

### Step 3: Seed Sample Demo Data *(Optional)*

To populate realistic contacts, conversations, and keyword rules into MongoDB:
```bash
cd backend
npm run seed
```

---

### Step 4: Run the Application

Open two terminal windows:

#### Terminal 1 — Start the Backend Server (Port 5000)
```bash
cd backend
npm run dev
```
Output:
```
----------------------------------------------------
🚀 Starting WhatBot WhatsApp Business Platform Backend
----------------------------------------------------
[MongoDB] Connected successfully to mongodb://127.0.0.1:27017/whatsapp_chatbot
✅ Backend server running on http://localhost:5000
📡 WhatsApp Webhook URL: http://localhost:5000/api/webhooks/whatsapp
🧪 Mode: demo (Meta Cloud API credentials optional)
```

#### Terminal 2 — Start the Frontend Dev Server (Port 3000)
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔑 Demo Access & Role Switching

When opening `http://localhost:3000`, the app automatically signs in with pre-configured demo access:
- **Demo Administrator**: Full access to all 10 modules, settings, and rule configurations.
- **Role Switcher**: Click the **Switch Role** button in the bottom-left sidebar anytime to toggle between **Admin** (`Sarah Connor`) and **Agent** (`Alex Rivera`).

---

## 🌐 Connecting Official Meta WhatsApp Cloud API (Future Production)

When you are ready to switch from Demo Sandbox to the live Meta API:

1. **Meta Developer Account**: Go to [developers.facebook.com](https://developers.facebook.com) and create a **Business** App.
2. **Add WhatsApp**: Under "Add products", select **WhatsApp**.
3. **Copy Identifiers**:
   - Go to **API Setup** and copy your **Phone Number ID** and **WhatsApp Business Account ID (WABA ID)**.
4. **Generate Permanent Token**:
   - In [Meta Business Manager Settings](https://business.facebook.com/settings) → **System Users**, create a System User.
   - Generate an access token with permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
5. **Paste into WhatBot Settings**:
   - Open **WhatsApp API Settings** in WhatBot (`http://localhost:3000`).
   - Switch integration mode from **Demo Sandbox** to **Live Meta Cloud API Mode**.
   - Paste your **WABA ID**, **Phone Number ID**, and **Permanent Access Token**.
   - Click **Save API Configuration**.
6. **Set up Webhooks in Meta**:
   - In the Meta App Dashboard under **WhatsApp → Configuration**, click **Edit Webhook**.
   - **Callback URL**: `https://your-public-domain.com/api/webhooks/whatsapp`
   - **Verify Token**: `whatbot_secure_token` (matches your settings).
   - Subscribe to the **`messages`** webhook field.
7. **Test Connection**:
   - Click **"Test Connection"** on the Settings page to verify your credentials against Meta's Graph API endpoints.

---

## 🔒 Security Standards

- **No Exposed Credentials**: Access tokens are stored on the server side and never sent in plain text to the browser.
- **Token Masking**: Tokens are serialized as `EAAG••••••••••••92a1`.
- **Zero Logging**: Tokens and customer secrets are never printed to server logs.
- **Truthful Status**: The platform never reports `Connected` unless a verified Graph API handshake succeeds.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
