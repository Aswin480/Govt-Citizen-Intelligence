# Implementation Plan: "Parivar Pehchan" (Digital Family Unity System)

## Objective
To create a "Digital Family Unit" within the My Portal ecosystem. This allows a head of household to add family members, creating a shared "Family Dashboard" alongside their individual personal dashboard.

## core Concept
**"Privacy First, Unity Where It Matters."**
- **Personal Data (Private):** Bank Accounts, Medical History, Voting choices.
- **Family Data (Shared):** Ration Card, Electricity Bill, Gas Connection, Property Tax, Farming Land Records.

## 1. Feature Architecture

### A. The Family Tree Builder (Onboarding/Setup)
- **Visual Interface:** An interactive tree where the user (Head) adds nodes (Spouse, Child, Parent).
- **Data Collection:**
    - Name
    - Relationship (Wife, Son, Father)
    - Age (Triggers lifecycle events)
    - Aadhaar/ID (Optional, for linking)

### B. "Sanjha Chulha" (The Common Dashboard)
A new tab in `UserDashboard` exclusively for shared family resources.
1.  **Smart Ration Card:** Visually shows *all* members. If one member collects rations, the status updates for everyone ("Collected by Suresh").
2.  **Utility Command:** One bill for the whole house. Anyone in the family can pay the electricity bill.
3.  **Document Vault (Shared):** A safe folder for "property deeds," "vehicle RC," or "insurance policies" that everyone needs access to.

### C. "Jeevan Setu" Integration (Lifecycle syncing)
The system analyzes the *combined* family data for powerful insights:
- *Scenario:* "Father is 60" + "Son is 18".
- *System Action:* Suggests "Education Loan" for son using Father's "Pension" as guarantee.

## 2. Implementation Steps

### Step 1: Create Family Data Structure (`FamilyContext`)
We need a state manager to hold the family graph.
```typescript
interface FamilyMember {
  id: string;
  name: string;
  relation: 'Self' | 'Spouse' | 'Child' | 'Parent';
  age: number;
  avatar: string;
}
```

### Step 2: Build the "Parivar Editor" Feature
- Add a new button in `UserDashboard` -> **"Manage Family"**.
- A modal form to add/remove members easily.

### Step 3: The "Sanjha" View (Shared Cards)
- Create a specific UI section that lists:
    - **Ration Card:** Dynamic list of members.
    - **Gas Booking:** Shared toggle.
    - **Health Shield:** Shows insurance coverage for the whole group.

### Step 4: Admin Preview Integration
- Ensure this new "Family View" is fully editable in the Admin Data Management panel. The admin can "simulate" adding a child and see how the Ration Card updates instantly.

## 3. UI/UX Design (Elite)
- **Visuals:** Use warm, connecting lines between member avatars.
- **Indicators:** Green dot for "Active/Present", Grey for "Away/Migrant".
- **Safety:** OTP required from Head to access shared data on a new device.

## 4. Execution Order
1.  Create `FamilyMember` interfaces and mock data.
2.  Update `UserDashboard.tsx` to include the "Parivar" Section.
3.  Implement the "Add Member" logic.
4.  Build the "Shared Resources" cards.
