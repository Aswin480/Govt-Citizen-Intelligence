# Implementation Plan: The Constitutional Trace Engine (No AI)

## Objective
Create a deterministic, rule-based analysis engine that evaluates legislative bills against the Indian Constitution without using Large Language Models (LLMs). The system will strictly use coded logic, lookup tables, and constitutional schedules to determine valid jurisdiction, beneficiaries, and socio-economic impact.

## 1. The "Brain" (Data Structures)
Since we cannot use AI, we will build a Relational Knowledge Graph in TypeScript.

### A. The Constitution Database (`ConstitutionData.ts`)
We will digitize key parts of the Constitution into a queryable format:
- **Schedules**: Specifically Schedule 7 (Union List, State List, Concurrent List) to check Jurisdiction (Who is needed?).
- **Fundamental Rights**: Articles 14-35 (Equality, Freedom, Life, Religion).
- **Directive Principles**: Guidelines for state policy (Welfare, Uniform Code).

```typescript
const CONSTITUTION = {
  articles: [
    { id: "Art14", title: "Equality before Law", keywords: ["discrimination", "equality", "religion", "caste"] },
    { id: "Art21", title: "Protection of Life & Liberty", keywords: ["privacy", "health", "environment"] }
  ],
  jurisdiction: {
    union: ["Defense", "Banking", "Foreign Affairs", "Railways"],
    state: ["Police", "Agriculture", "Health", "Land"],
    concurrent: ["Education", "Forests", "Marriage"]
  }
};
```

### B. The Bill Database (`BillData.ts`)
We will create mock bills with specific "attributes" that the engine can read.
```typescript
{
  id: "BILL_01",
  name: "National Digital Health ID Bill",
  sector: "Health",
  impact_level: "High",
  tags: ["privacy", "health", "digital"],
  beneficiaries: ["Middle Class", "Tech Sector"],
  burden: ["Rural Poor (Digital Divide)"]
}
```

## 2. The Logic Engine (`TraceEngine.ts`)
This is the "code brain" that replaces the LLM. It runs a 3-step trace:

### Step 1: Jurisdiction Check (The "Who is Needed?" Test)
- **Input**: Bill Sector (e.g., "Health").
- **Logic**: Check `CONSTITUTION.jurisdiction`.
- **Result**: "Health" is a State Subject. If the Center passes this bill, the engine flags a **"Federal Structure Warning"** (Against Law?).

### Step 2: Fundamental Rights Scan (The "Is it Valid?" Test)
- **Input**: Bill Tags (e.g., "Privacy").
- **Logic**: Search `CONSTITUTION.articles` for matching keywords.
- **Result**: Matches Article 21. The engine checks if the bill has a "Privacy Protection" flag. If not -> **"Violation Risk: Article 21"**.

### Step 3: Socio-Economic Impact Calculator (The "Who Gains?" Test)
- **Logic**: A weighted scoring system based on the bill's attributes.
    - If `type == "Digital"` -> Benefit: **Middle/Upper Class** | Burden: **Digital Illiterate (Poor)**.
    - If `type == "Subsidy"` -> Benefit: **Poor** | Burden: **Taxpayers (Middle Class)**.

## 3. The User Interface ("The Archives")
We will build a visually "Ancient yet Modern" interface.

- **Visual Style**: "Constitution Book" aesthetic. Parchment textures mixed with digital holographic lines.
- **Interaction**:
    1.  User selects a Bill from a designated "Docket".
    2.  The "Constitution Book" opens to the relevant page (e.g., Page 14 for Equality).
    3.  **The Trace**: A visible line is drawn from the Bill to the Article.
    4.  **The Verdict**: A stamped report appears:
        -   **Jurisdiction**: ✅ Valid / ❌ Overreach
        -   **Winner**: 👔 Rich / 👷 Poor / 👨‍💻 Middle Class
        -   **Constitutionality**: ⚠️ Under Review

## 4. Implementation Steps
1.  **Create Data Files**: `src/data/constitution.ts` and `src/data/bills.ts`.
2.  **Build Engine**: `src/utils/constitutionalEngine.ts`.
3.  **Build Interface**: `src/pages/ConstitutionExplorer.tsx`.
4.  **Integrate**: Add navigation from Dashboard to this new tool.
