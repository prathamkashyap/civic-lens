# Architecture Decision Records

## ADR-001: Vite and React for the frontend

**Decision:** Use React with Vite and TypeScript.

**Alternatives considered:** Next.js and Create React App.

**Reasoning:** Civic Lens is a client-heavy dashboard with Firebase services and no server-rendered page requirement. Vite provides a fast development loop and a small, explicit deployment surface while TypeScript keeps route and data contracts visible.

## ADR-002: Firebase for authentication and report storage

**Decision:** Use Firebase Authentication and Firestore.

**Alternatives considered:** A custom API with PostgreSQL or a hosted SQL backend.

**Reasoning:** Firebase supplies authentication, realtime report updates, and a managed document store with low operational overhead for the project. The application keeps the persistence boundary in the data layer so a future service can replace it if relational querying becomes necessary.

## ADR-003: Hybrid analytics workflow

**Decision:** Keep model training and spatial analysis in Python, with exported dashboard data in the frontend.

**Alternatives considered:** Training models in the browser or adding a live inference service immediately.

**Reasoning:** Python provides the mature scientific stack needed for feature engineering, model comparison, and DBSCAN. Exported artifacts make the current dashboard deterministic and inexpensive to deploy while leaving room for a future authenticated inference service.

## ADR-004: Priority classification and DBSCAN hotspots

**Decision:** Use interpretable priority features with classical baselines and XGBoost, plus DBSCAN for spatial clusters.

**Alternatives considered:** A deep-learning classifier and fixed grid bucketing for hotspots.

**Reasoning:** The selected models fit the available data size, expose useful feature behavior for civic stakeholders, and avoid requiring a preselected number of clusters. Results remain explainable enough for an academic and municipal decision-support context.
