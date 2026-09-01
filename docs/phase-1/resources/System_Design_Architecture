# 4. System Design and Architecture

## 4.1 Overview

The Smart Civic Issue Register & Tracker employs a **modern serverless architecture** designed for scalability, cost-efficiency, and ease of maintenance. This section describes the system architecture, data flow, deployment model, and integration of machine learning components to enable intelligent complaint management.

---

## 4.2 Architectural Design Philosophy

The system architecture follows key design principles:

- **Serverless Computing:** Eliminates the need for dedicated backend servers, reducing operational overhead and infrastructure costs.
- **Separation of Concerns:** Each component (frontend, storage, media, ML) operates independently and can be updated or scaled without affecting others.
- **Cloud-Native Stack:** Leverages industry-leading cloud services for reliability, security, and scalability.
- **Real-Time Data Flow:** Enables instantaneous updates and notifications across all system components.
- **Security by Design:** Implements role-based access control, encrypted communications, and secure credential management.

---

## 4.3 Technology Stack

### Frontend Layer
- **React.js:** Modern, component-based JavaScript framework for building interactive user interfaces.
- **TypeScript:** Provides static type checking for improved code reliability and maintainability.
- **Tailwind CSS:** Utility-first CSS framework for responsive design and rapid UI development.
- **Axios:** HTTP client for making asynchronous requests to cloud services and APIs.
- **Leaflet.js & Geolocation API:** For interactive map rendering and GPS-based location detection.
- **Firebase SDK:** Client-side JavaScript library for direct Firestore database access and real-time updates.

### Backend Services (Serverless)
- **Firebase Firestore:** NoSQL real-time database for storing complaints, user data, and metadata. Provides automatic scaling and real-time synchronization.
- **Cloudinary:** Cloud-based image and video storage service with automatic optimization, delivery, and transformation capabilities.
- **Firebase Cloud Functions:** Serverless compute for executing backend logic (optional, for advanced features like automated workflows).

### Machine Learning Pipeline
- **Python 3.10+:** Primary language for ML model development.
- **TensorFlow / PyTorch:** Deep learning frameworks for image classification (CNN-based models).
- **Hugging Face Transformers:** Pre-trained models (DistilBERT, BERT) for natural language processing and text classification.
- **scikit-learn:** For traditional ML models, vectorization, and evaluation metrics.
- **Jupyter Notebook / JupyterLab:** Development and experimentation environment.
- **Plotly / Folium:** Libraries for data visualization and interactive mapping.

### Deployment & Infrastructure
- **Vercel / Netlify:** Hosting platforms for frontend deployment with automatic scaling.
- **Google Cloud Platform / AWS:** Hosting ML models and scheduled batch processing.
- **Firebase Hosting:** Alternative frontend and backend hosting with built-in CDN.

---

## 4.4 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SMART CIVIC ISSUE TRACKER                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Frontend)                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │           React + TypeScript + Tailwind CSS (Web App)               │     │
│  │                                                                     │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │ Citizen Form │  │ Admin Panel  │  │ Status Track │               │     │
│  │  │ (Register)   │  │ (Dashboard)  │  │ (Real-time)  │               │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │     │
│  │                                                                     │     │
│  │  Features: GPS location, photo upload, form validation              │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│         ↓ Axios + Firebase SDK      ↓ Axios (Cloudinary)                     │
└──────────────────────────────────────────────────────────────────────────────┘
             ↓                               ↓
┌──────────────────────────┐   ┌──────────────────────────┐
│  FIREBASE FIRESTORE DB   │   │  CLOUDINARY CDN          │
│  (Real-time Database)    │   │  (Image/Video Storage)   │
│                          │   │                          │
│ ┌────────────────────┐   │   │ ┌────────────────────┐   │
│ │ Complaints         │   │   │ │ Image URLs         │   │
│ │ Users              │   │   │ │ Optimized Media    │   │
│ │ Status Updates     │   │   │ │ Public CDN Access  │   │
│ │ Notifications      │   │   │ └────────────────────┘   │
│ └────────────────────┘   │   │                          │
│ Real-time Sync ✓         │   │ Fast Delivery ✓          │
└──────────────────────────┘   └──────────────────────────┘
         ↓                              ↓
         └──────────────┬───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  ML MODEL PIPELINE (External)│
         │                              │
         │  ┌────────────────────────┐  │
         │  │ Image Classification   │  │
         │  │ (CNN: MobileNet/ResNet)│  │
         │  └────────────────────────┘  │
         │             ↓                │
         │  ┌────────────────────────┐  │
         │  │ Text Classification    │  │
         │  │ (BERT/DistilBERT)      │  │
         │  └────────────────────────┘  │
         │             ↓                │
         │  ┌────────────────────────┐  │
         │  │ Priority Scoring       │  │
         │  │ + Department Routing   │  │
         │  └────────────────────────┘  │
         └──────────────────────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Predictions Written Back to │
         │  Firestore with Category,    │
         │  Priority, Confidence Scores │
         └──────────────────────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  Firebase Cloud Functions    │
         │  (Notification Dispatcher)   │
         │                              │
         │  SMS / Push Notifications    │
         │  to Citizens & Officials     │
         └──────────────────────────────┘

```

**Figure 1: High-Level System Architecture Diagram**

---

## 4.5 Data Flow Diagram

### Complaint Submission Flow (Citizen Workflow)

```
START: Citizen Opens App
         ↓
    Form Presented
    (Location, Photo, Description)
         ↓
    User Fills Form
    ├─ GPS Auto-detects Location
    ├─ Selects Location on Map (if needed)
    ├─ Uploads Photo/Video
    └─ Types Description
         ↓
    Client-Side Validation
    (Required fields, file size, etc.)
         ↓
    Photo Uploaded to Cloudinary
    ├─ Returns Public URL
    └─ Optimized for delivery
         ↓
    Complaint Data + Cloudinary URL
    Written to Firestore (Real-time)
         ↓
    Unique Ticket ID Generated
    (Format: TICKET-TIMESTAMP-RANDOM)
         ↓
    Citizen Receives Confirmation
    (with Ticket ID)
         ↓
    Firestore Triggers ML Pipeline
    ├─ Fetches image from Cloudinary URL
    ├─ Downloads image and description
    └─ Sends to ML model for processing
         ↓
    ML Model Processes
    ├─ Image Classification (CNN)
    ├─ Text Analysis (BERT)
    ├─ Priority Scoring
    └─ Department Assignment
         ↓
    Predictions Written Back to Firestore
    (category, priority, confidence)
         ↓
    Admin Dashboard Updated Instantly
    (Complaint appears in relevant dept queue)
         ↓
    SMS/Push Notification to Admin
    (New complaint in their queue)
         ↓
    Admin Assigns to Staff Member
    & Sets Deadline
         ↓
    Status Changed to "In Progress"
         ↓
    Citizen Receives Notification
    (Status Update: In Progress)
         ↓
    Field Staff Updates Progress
    (uploads work photos, adds notes)
         ↓
    Citizen Gets Real-time Updates
         ↓
    Issue Resolved by Staff
    (uploads completion photos,
     adds resolution notes)
         ↓
    Status Changed to "Resolved"
         ↓
    Firestore Triggers Notification
         ↓
    Citizen & Admin Receive
    Resolution Notification
         ↓
    Analytics Dashboard Updated
    (complaint added to historical data)
         ↓
    Data Available for Future
    Predictive Maintenance Models
         ↓
    END: Issue Closed
```

**Figure 2: Complete Complaint Lifecycle Data Flow**

---

## 4.6 Machine Learning Pipeline Architecture

```
┌─────────────────────────────────────────────────────┐
│      ML PIPELINE ARCHITECTURE                       │
└─────────────────────────────────────────────────────┘

INPUT SOURCES
├─ Complaint Description (Text)
│  └─ Stored in Firestore
│
└─ Image URL (from Cloudinary)
   └─ Public CDN URL

         ↓

┌─────────────────────────────────────────────────────┐
│  TEXT PROCESSING PIPELINE                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Text Extraction                                 │
│     complaint_text = get_description_from_firestore()
│                                                     │
│  2. Preprocessing                                   │
│     ├─ Lowercase conversion                         │
│     ├─ Remove special characters/punctuation        │
│     ├─ Tokenization (split into words)              │
│     └─ Remove stop words                            │
│                                                     │
│  3. Embedding (BERT-based)                          │
│     ├─ DistilBERT tokenization                      │
│     ├─ Convert tokens to embeddings (768-dim)       │
│     └─ Capture semantic meaning                     │
│                                                     │
│  4. Classification (Logistic Regression / SVM)      │
│     Input: Text embeddings                          │
│     Classes: [Waste, Water, Infrastructure, ...]    │
│     Output: Category + Confidence score             │
│                                                     │
└─────────────────────────────────────────────────────┘
                            ↓
 
┌─────────────────────────────────────────────────────┐
│  IMAGE PROCESSING PIPELINE                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Image Retrieval                                 │
│     image_url = fetch_from_cloudinary()             │
│     image = download_image(image_url)               │
│                                                     │
│  2. Preprocessing                                   │
│     ├─ Resize to 224x224 pixels                     │
│     ├─ Normalize pixel values [0, 1]                │
│     ├─ Apply data augmentation (optional)           │
│     └─ Convert to tensor                            │
│                                                     │
│  3. Feature Extraction (CNN)                        │
│     ├─ MobileNetV2 / ResNet-50                      │
│     ├─ Pre-trained on ImageNet                      │
│     ├─ Extract deep features (2048-dim)             │
│     └─ Transfer learning approach                   │
│                                                     │
│  4. Image Classification                            │
│     Input: Image features                           │
│     Classes: [Pothole, Garbage, Streetlight, ...]   │
│     Output: Issue type + Confidence                 │
│                                                     │
└─────────────────────────────────────────────────────┘
                            ↓

┌─────────────────────────────────────────────────────┐
│  FUSION & PRIORITY SCORING                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Input Signals:                                     │
│  ├─ Text classification result + confidence         │
│  ├─ Image classification result + confidence        │
│  ├─ Location coordinates (lat, lng)                 │
│  ├─ Timestamp                                       │
│  └─ Historical complaint density in area            │
│                                                     │
│  Priority Scoring Logic:                            │
│  ├─ Base Score: Category urgency (0-3)              │
│  │  └─ Waste: 1, Water: 2.5, Sanitation: 3          │
│  ├─ Location Bonus: +1.5 if near school/hospital    │
│  ├─ Cluster Bonus: +1.0 if area has ≥3 complaints   │
│  ├─ Recency Bonus: +0.5 if reported multiple times  │
│  └─ Final Score: min(10, sum of all bonuses)        │
│                                                     │
│  Priority Level Assignment:                         │
│  ├─ Score ≥ 7: HIGH (resolve within 24 hours)       │
│  ├─ Score 4-6: MEDIUM (resolve within 3 days)       │
│  └─ Score < 4: LOW (routine maintenance)            │
│                                                     │
│  Department Assignment:                             │
│  └─ category → department mapping                   │
│     └─ Route to appropriate queue                   │
│                                                     │
└─────────────────────────────────────────────────────┘
                            ↓

┌─────────────────────────────────────────────────────┐
│  OUTPUT TO FIRESTORE                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  prediction_obj = {                                 │
│    ticket_id: "TICKET-...",                         │
│    text_category: "Waste",                          │
│    text_confidence: 0.92,                           │
│    image_category: "Garbage",                       │
│    image_confidence: 0.88,                          │
│    final_category: "Waste",  // consensus           │
│    priority_score: 7.5,                             │
│    priority_level: "HIGH",                          │
│    assigned_department: "Sanitation",               │
│    ml_processed_at: timestamp,                      │
│    model_version: "v1.0"                            │
│  }                                                  │
│                                                     │
│  Firestore Update:                                  │
│  └─ /complaints/{ticket_id}/ml_predictions          │
│                                                     │
└─────────────────────────────────────────────────────┘

```

**Figure 3: Machine Learning Pipeline Architecture**

---

## 4.7 Notification System Architecture

```
┌──────────────────────────────────────────────────────────┐
│         NOTIFICATION & COMMUNICATION SYSTEM              │
└──────────────────────────────────────────────────────────┘

EVENT TRIGGERS
├─ Complaint Submitted
├─ Status Changed (Pending → In Progress → Resolved)
├─ Assigned to Staff
├─ Deadline Approaching
└─ Resolution Completed

                            ↓

┌──────────────────────────────────────────────────────────┐
│  FIREBASE CLOUD FUNCTIONS (Event Listeners)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Function: onComplaintCreated()                          │
│  ├─ Trigger: Firestore write to /complaints/{ticket}     │
│  ├─ Action: Queue notification task                      │
│  └─ Recipient: Admin officers (SMS/Push)                 │
│                                                          │
│  Function: onStatusChanged()                             │
│  ├─ Trigger: Status field updated                        │
│  ├─ Action: Notify citizen of progress                   │
│  └─ Channels: SMS, Push notification, Email              │
│                                                          │
│  Function: onPriorityAssigned()                          │
│  ├─ Trigger: ML model assigns priority                   │
│  ├─ Action: Update dashboard queue                       │
│  └─ Filter: Only HIGH priority → escalation alerts       │
│                                                          │
└──────────────────────────────────────────────────────────┘
                            ↓

┌──────────────────────────────────────────────────────────┐
│  NOTIFICATION DISPATCHER                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Determine notification type based on:                   │
│  ├─ Recipient role (citizen vs. admin)                   │
│  ├─ Notification preference (SMS vs. Push vs. Email)     │
│  ├─ Priority level                                       │
│  └─ User's timezone                                      │
│                                                          │
│  Compose notification message:                           │
│  ├─ Ticket ID                                            │
│  ├─ Status / Action                                      │
│  ├─ Relevant details (priority, deadline, etc.)          │
│  └─ Call-to-action link                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
                            ↓

┌──────────────────────────────────────────────────────────┐
│  DELIVERY CHANNELS                                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Firebase        │  │ Third-party     │                │
│  │ Cloud           │  │ SMS/Email       │                │
│  │ Messaging       │  │ Gateway         │                │
│  │ (Push Notify)   │  │ (Twilio, etc.)  │                │
│  │                 │  │                 │                │
│  │ User Devices    │  │ SMS / Email     │                │
│  └─────────────────┘  └─────────────────┘                │
│         ↓                      ↓                         │
│  Mobile App Push       User's Phone / Email              │
│  Instant delivery      Guaranteed delivery               │
│  (when online)         (offline-safe)                    │
│                                                          │
└──────────────────────────────────────────────────────────┘

EXAMPLE NOTIFICATIONS:

[Citizen - New Complaint]
"✓ Complaint registered! Ticket ID: TC-20251126-4521
Track your issue at: [link]"

[Admin - New High Priority Complaint]
"🔴 HIGH PRIORITY | Sewage overflow near school
Location: [address] | Ticket: TC-20251126-4521"

[Citizen - Status Update]
"Your complaint #TC-20251126-4521 is now In Progress
Estimated completion: Nov 28, 2025"

[Citizen - Resolution]
"✓ Your complaint #TC-20251126-4521 is RESOLVED!
Please rate our service: [link]"

```

**Figure 4: Notification System Architecture**

---

## 4.8 Database Schema (Firestore)

### Collections Structure

```
firestore/
├── complaints/
│   ├── {ticket_id}/
│   │   ├── id: string
│   │   ├── user_id: string
│   │   ├── description: string
│   │   ├── category: string (auto-assigned by ML)
│   │   ├── priority: number (0-10)
│   │   ├── priority_level: string ("HIGH" / "MEDIUM" / "LOW")
│   │   ├── status: string ("Pending" / "In Progress" / "Resolved")
│   │   ├── location:
│   │   │   ├── lat: number
│   │   │   ├── lng: number
│   │   │   └── address: string
│   │   ├── photo_url: string (Cloudinary URL)
│   │   ├── assigned_to: string (staff member ID)
│   │   ├── assigned_department: string
│   │   ├── deadline: timestamp
│   │   ├── created_at: timestamp
│   │   ├── updated_at: timestamp
│   │   ├── resolved_at: timestamp (if resolved)
│   │   ├── resolution_notes: string
│   │   ├── resolution_photos: array (Cloudinary URLs)
│   │   └── ml_predictions:
│   │       ├── text_category: string
│   │       ├── text_confidence: number
│   │       ├── image_category: string
│   │       ├── image_confidence: number
│   │       └── model_version: string
│   │
│   └── {ticket_id_2}/ ...
│
├── users/
│   ├── {user_id}/
│   │   ├── email: string (unique)
│   │   ├── name: string
│   │   ├── phone: string
│   │   ├── role: string ("citizen" / "staff" / "admin")
│   │   ├── department: string (if staff/admin)
│   │   ├── created_at: timestamp
│   │   ├── notification_preferences:
│   │   │   ├── sms_enabled: boolean
│   │   │   ├── push_enabled: boolean
│   │   │   └── email_enabled: boolean
│   │   └── complaint_count: number
│   │
│   └── {user_id_2}/ ...
│
├── departments/
│   ├── sanitation/
│   │   ├── name: string
│   │   ├── head: string (staff ID)
│   │   ├── complaint_categories: array
│   │   ├── response_time_sla: number (hours)
│   │   └── current_queue_count: number
│   │
│   └── infrastructure/ ...
│
└── analytics/
    ├── daily_stats/
    │   ├── {date}/
    │   │   ├── total_complaints: number
    │   │   ├── resolved_today: number
    │   │   ├── avg_resolution_time: number
    │   │   ├── by_category: map
    │   │   └── by_priority: map
    │   │
    │   └── {date_2}/ ...
    │
    └── heatmap_data/
        ├── {grid_cell}/
        │   ├── lat_min, lat_max, lng_min, lng_max
        │   ├── complaint_count: number
        │   └── last_updated: timestamp
        │
        └── {grid_cell_2}/ ...

```

**Figure 5: Firestore Database Schema**

---

## 4.9 System Working Principle (Step-by-Step)

### Phase 1: Complaint Registration (Citizen)

1. **User opens the web application** → Authentication check via Firebase Auth
2. **Location Detection:**
   - App requests GPS permission (geolocation API)
   - Auto-detects latitude/longitude
   - Displays on Leaflet map for verification/adjustment
3. **Photo/Video Upload:**
   - User selects file from device
   - File validated (size < 25 MB, format: jpg/png/mp4)
   - Uploaded directly to Cloudinary via Axios (client-side)
   - Cloudinary returns optimized image URL
4. **Form Submission:**
   - User fills: description, category (optional)
   - Validates form (all required fields)
   - Submits via Firebase SDK to Firestore
5. **Firestore Write:**
   - New document created at `/complaints/{ticket_id}`
   - Stored data: description, location, photo_url, user_id, timestamp, status="Pending"
   - Real-time listener notifies admin dashboard instantly

### Phase 2: ML Processing (Automated Backend)

1. **Trigger: Cloud Function fires** on Firestore write event
2. **Data Retrieval:**
   - Reads complaint description from Firestore
   - Downloads image from Cloudinary URL
3. **Text Analysis:**
   - Preprocess description text
   - Tokenize using DistilBERT tokenizer
   - Generate 768-dimensional embeddings
   - Pass through trained classification head → Predict category + confidence
4. **Image Analysis:**
   - Preprocess image (resize, normalize)
   - Extract features using MobileNetV2 (pre-trained)
   - Pass through classification head → Predict issue type + confidence
5. **Fusion & Scoring:**
   - Combine text & image predictions (weighted average)
   - Calculate priority score based on category, location, historical data
   - Assign to department
6. **Write Predictions:**
   - Update Firestore doc with predictions
   - Trigger notification to admin

### Phase 3: Admin Review & Assignment

1. **Admin Dashboard loads** → Real-time updates via Firestore listeners
2. **Complaint appears** in department queue with:
   - Ticket ID, location, description, photo, priority level
3. **Admin Reviews:**
   - Checks ML predictions and confidence scores
   - Can override category if necessary
   - Views on map (interactive heatmap)
4. **Staff Assignment:**
   - Admin selects staff member from dropdown
   - Sets deadline (e.g., 24 hours for HIGH priority)
   - Clicks "Assign" button
5. **Status Update:**
   - Firestore updates: `status = "In Progress"`, `assigned_to = staff_id`
   - Cloud Function triggers → SMS/Push sent to staff
   - Citizen receives notification (status updated)

### Phase 4: Field Work & Progress Updates

1. **Staff member receives** notification (app/SMS)
2. **Opens complaint details:**
   - Views location, description, evidence photo
   - Navigates to site
3. **During work:**
   - Staff uploads progress photos
   - Adds work notes (e.g., "Repaired 2 potholes, 1 remaining")
   - Updates status to "In Progress" with notes
   - Firestore syncs in real-time
4. **Citizen sees** live updates on dashboard
   - Optional: Sends status notification

### Phase 5: Issue Resolution

1. **Work completed by staff**
2. **Staff uploads:**
   - Final completion photos (before/after)
   - Completion notes and description
3. **Updates status:**
   - Sets `status = "Resolved"`
   - Adds `resolved_at = timestamp`
   - Fills in `resolution_notes` and `resolution_photos`
4. **Firestore triggers Cloud Function:**
   - Generates notifications for citizen and admin
   - Updates analytics/reporting dashboard
   - Archives to historical data for ML training
5. **Citizen receives:**
   - Resolution notification with completion details
   - Optional: Feedback form link (rate the service)
6. **Admin Dashboard:**
   - Complaint moved to "Resolved" queue
   - Metrics updated (resolution time, category stats, etc.)

### Phase 6: Analytics & Insights

1. **Data Aggregation:**
   - All resolved complaints stored in analytics collection
   - Heatmap data generated (complaint density by geographic area)
2. **Dashboard Visualizations:**
   - Time series: complaints over time
   - Bar charts: complaints by category/department
   - Heatmap: geographic distribution of issues
   - Performance metrics: avg resolution time, SLA compliance
3. **Predictive Insights:**
   - ML identifies recurring locations (hotspots)
   - Predicts future issues in high-density areas
   - Recommends preventive maintenance schedules

---

## 4.10 Security Architecture

### Authentication & Authorization
- **Firebase Authentication:** Email/password, OAuth
- **Role-Based Access Control (RBAC):**
  - Citizen: Submit complaints, view own complaints
  - Staff: View assigned complaints, update status
  - Admin: Full access, manage staff, view analytics
- **Firestore Security Rules:** Enforce row-level access control

### Data Protection
- **Transport Security:** TLS 1.3 encryption for all network traffic
- **Data Encryption:** Firestore encrypts data at rest
- **API Keys:** Secure management via environment variables
- **Image Security:** Cloudinary secure URLs, CDN caching

### Privacy Considerations
- Optional anonymous complaint submission
- Personal data segregated from complaint data
- GDPR compliance: Data retention policies
- User consent for notification channels

---

## 4.11 Scalability & Performance Considerations

### Horizontal Scalability
- Firestore automatically scales read/write capacity
- Cloudinary handles unlimited image uploads
- Frontend CDN distributes assets globally
- ML models can be parallelized across multiple workers

### Performance Optimization
- Image optimization via Cloudinary (WebP, auto compression)
- Firestore indexing for fast queries
- React memoization for re-render prevention
- Lazy loading of images and map tiles

### Cost Efficiency
- Pay-as-you-go pricing (no fixed server costs)
- Firestore free tier: 1M read/write per day
- Cloudinary free tier: 10 GB storage + 20 GB bandwidth/month
- ML pipeline runs only on-demand

---

