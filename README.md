#  Smart Real Estate & Property Maintenance Management Platform

A full-stack property management platform built using React, Spring Boot, MongoDB, and JWT Authentication.
The platform enables property owners to list and manage properties, buyers and tenants to discover properties, tenants to raise maintenance requests, maintenance staff to manage assigned tasks, and administrators to oversee the entire system through dedicated dashboards.
Unlike traditional real estate listing systems, this platform integrates a complete maintenance management workflow with automated staff assignment, role-based access control, notifications, messaging, and operational monitoring.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## Key Features

### Authentication & Security
* JWT-based Authentication
* Secure Login & Registration
* Spring Security Integration
* Role-Based Access Control (RBAC)
* Protected APIs and Routes

### Property Management
* Create property listings
* Upload property images
* Update property information
* Mark properties as Sold
* Mark properties as Rented
* Property availability tracking
* Location-based property registration using Google Maps integration

### Property Discovery
* Property search and filtering
* Detailed property information pages
* Property image galleries
* Location-aware browsing

### User Communication
* Direct communication between interested users and property owners
* Property-related discussions
* Messaging system for negotiations and inquiries

### Tenancy Management
* Property owners can assign tenant details for rented properties
* Tenant information linked to specific properties
* Ownership and tenancy tracking

### Maintenance Management Workflow
* Tenants can raise maintenance requests
* Request categorization based on issue type
* Detailed issue descriptions
* Automated maintenance request routing
* First-Come First-Serve (FCFS) processing

### Intelligent Staff Assignment
The system automatically assigns maintenance requests by:
1. Identifying the maintenance category
2. Matching the request with maintenance staff skills
3. Creating maintenance tickets
4. Sending notifications to eligible staff
5. Tracking assignment and progress

### Maintenance Staff Dashboard
Maintenance staff can:
* View assigned requests
* Accept requests
* Reject requests
* Start maintenance work
* Update progress status
* Mark tasks as completed

### Administrative Dashboard
Administrators can:
* View all properties
* View all users
* Manage maintenance staff
* Configure staff skills
* Monitor maintenance operations
* Review reported fraud activities
* Access system-wide analytics and controls

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## User Roles

### User
A user can act as:
* Property Buyer
* Property Seller
* Tenant
Capabilities:
* Browse properties
* Search and filter listings
* Communicate with property owners
* Manage owned properties
* Raise maintenance requests (if assigned as a tenant)

### Maintenance Staff
Capabilities:
* Receive assigned maintenance tickets
* Accept or reject requests
* Track work progress
* Update task status
* Complete maintenance operations

### Administrator
Capabilities:
* Complete platform oversight
* User management
* Property monitoring
* Staff management
* Maintenance workflow monitoring
* Fraud review and management

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## System Workflow

### Property Lifecycle

```text
Property Owner
      │
      ▼
Create Property Listing
      │
      ▼
Upload Images & Location
      │
      ▼
Available for Sale / Rent
      │
      ▼
Buyer / Tenant Interaction
      │
      ▼
Owner Updates Status
(Sold / Rented)
```

### Maintenance Workflow

```text
Tenant
      │
Raise Request
      │
      ▼
Maintenance Request Created
      │
      ▼
Skill Matching Engine
      │
      ▼
Staff Assignment
      │
      ▼
Staff Accepts Request
      │
      ▼
Work In Progress
      │
      ▼
Task Completed
```

---

## Technology Stack

### Frontend
* React
* JavaScript
* HTML
* CSS

### Backend
* Java
* Spring Boot
* Spring Security
* REST APIs

### Authentication
* JWT (JSON Web Tokens)

### Database
* MongoDB

### Development Tools
* Git
* GitHub
* Maven
* IntelliJ IDEA

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Database Design

### Collections

```text
users
properties
tenancies
messages
notifications
inquiries
maintenance_requests
maintenance_tickets
```

### Core Relationships
```text
User
 ├── Properties
 ├── Messages
 └── Tenancies

Property
 ├── Owner
 ├── Tenant
 ├── Inquiries
 └── Maintenance Requests

Maintenance Request
 └── Maintenance Ticket
        └── Maintenance Staff
```

---

## Project Structure

```text
real-estate-management-system

├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── realestate/
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
│
├── screenshots/
│
└── README.md
```

---

## Installation & Setup

### Clone Repository

```bash
git clone https://github.com/Sivaprasad2k/real-estate-management-system.git

cd real-estate-management-system
```

### Backend Setup

```bash
cd realestate

mvn clean install

mvn spring-boot:run
```

Backend Server:

```text
http://localhost:8080
```

### MongoDB Setup

Install:

* MongoDB Community Edition
* MongoDB Compass

Start MongoDB service before running the backend application.

Update connection settings inside:

```text
src/main/resources/application.properties
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend Server:

```text
http://localhost:5173
```

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Future Enhancements

* Cloud Deployment (AWS / Azure)
* Containerization using Docker
* Microservices Architecture
* Email Notifications
* Mobile Application
* Advanced Analytics Dashboard
* AI-powered Property Recommendations

---

## Learning Outcomes

This project provided practical experience with:
* Full Stack Application Development
* JWT Authentication
* Role-Based Access Control (RBAC)
* REST API Design
* MongoDB Data Modeling
* Workflow Management Systems
* Notification Systems
* Dashboard Design
* Property Management Domain Modeling
* Real-world Business Logic Implementation

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Authors

### Siva Prasad
LinkedIn: https://www.linkedin.com/in/sivaprasadml
GitHub: https://github.com/Sivaprasad2k

### Ritharaj P
LinkedIn: linkedin.com/in/ritharaj-p-267987293
Github: https://github.com/Ritha-blip

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

