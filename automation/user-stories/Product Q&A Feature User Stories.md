# User Stories — Product Q&A (Phase 1)
*(Generated per Hackathon Prompt H-02 format — Phase 1 items only)*

## Story 1 — View Q&A Section
**As a** shopper, **I want** to view existing questions and answers on a product page, **so that** I can resolve pre-purchase doubts before buying.

**Acceptance Criteria:**
- The Q&A section appears below the Reviews section, headed "Customer Questions & Answers."
- Questions are listed in reverse chronological order (most recent first).
- Answered questions show the answer text and the answerer's role label ("Customer" or "Team") beneath the question.
- Unanswered questions show no answer block.
- Guests can read all content but see no way to post without logging in.

**Estimated Effort:** Small

---

## Story 2 — Ask a Question
**As a** logged-in customer, **I want** to ask one question about a product, **so that** I can get clarification before purchasing.

**Acceptance Criteria:**
- A text area and "Submit Question" button are shown to logged-in users at the bottom of the list.
- A live character counter enforces a 200-character maximum, checked on both client and server.
- Attempting a second question on the same product is blocked with a generic message: "Only one question per product is allowed."
- Guests attempting to ask a question are prompted to log in instead.

**Estimated Effort:** Medium

---

## Story 3 — Answer a Question
**As a** logged-in user, **I want** to answer a product question that has no answer yet, **so that** other shoppers get the information they need.

**Acceptance Criteria:**
- The "Add Answer" control appears only on unanswered questions, and only for logged-in users.
- A live character counter enforces a 500-character maximum, checked on both client and server.
- Once a question is answered, the "Add Answer" control is hidden for that question for all users.
- A second answer attempt on an already-answered question is rejected by the server, even if submitted directly to the API.

**Estimated Effort:** Medium

---

## Story 4 — Role-Based Answer Labelling
**As a** shopper reading the Q&A section, **I want** to see whether an answer came from KnackStore staff or a fellow customer, **so that** I can judge how authoritative it is.

**Acceptance Criteria:**
- Answers from users with role ADMIN or STAFF are labelled "Team."
- Answers from all other users are labelled "Customer."
- No new roles or account permission changes are introduced by this feature.

**Estimated Effort:** Small

---

## Story 5 — Immediate Publication (No Moderation)
**As a** KnackStore operations lead, **I want** questions and answers to publish immediately without a moderation step, **so that** the Q&A section stays simple for this sprint's scope.

**Acceptance Criteria:**
- Valid question and answer submissions are visible to all visitors immediately, with no pending/approval state.
- No moderation status field exists on the Question or Answer data model in this sprint.

**Estimated Effort:** Small

---
*Source: FSD — Product Q&A, Phase 1 (H-01 output above). Phase 2 items (multiple answers, moderation queue) are intentionally excluded per prompt instructions.*
