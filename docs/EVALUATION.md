# Evaluation -- Metrics, Calibration, and Experiment Design

> **Purpose:** Define how we measure whether the system is working, how we calibrate the scoring engine, how we test templates and models, and what "good" looks like quantitatively.

---

## 1. Key Metrics Definitions

### 1.1 Funnel Metrics

| Metric | Definition | Formula | Target |
|--------|-----------|---------|--------|
| **Capture rate** | Jobs captured per week | count(jobs where stage >= Captured, created this week) | 15-25/week |
| **Pursue rate** | Share of scored jobs labeled Pursue | count(Pursue) / count(Scored) | 25-40% |
| **Outreach rate** | Share of Pursued jobs with outreach sent | count(Outreach Sent) / count(Pursue) | 80%+ |
| **Response rate** | Share of outreach that gets a reply | count(Response) / count(Outreach Sent) | 15-25% |
| **Screen rate** | Share of responses that convert to screen | count(Screen) / count(Response) | 50%+ |
| **Interview advance rate** | Share of screens that advance to interviews | count(Interviewing) / count(Screen) | 40%+ |
| **Offer rate** | Share of interviews that produce offers | count(Offer) / count(Interviewing) | 20%+ |
| **Closed Won rate** | Share of offers accepted | count(Closed Won) / count(Offer) | Depends on pipeline |
| **False positive rate** | Pursued jobs that should have been passed | Manual review of Pursue jobs that result in Pass/Closed Lost with mismatch reason | < 20% |
| **False negative rate** | Passed jobs that should have been pursued | Periodic review of Passed jobs; flag any that were strong fits | < 10% |

### 1.2 Velocity Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Time-to-qualify** | Time from capture to score + label assignment | < 20 seconds |
| **Time-to-outreach** | Time from capture to first outreach sent | < 2 minutes |
| **Time-in-stage (median)** | Median days a job spends in each stage | Varies by stage |
| **Time-to-offer** | Days from first capture to offer | Track, no fixed target |
| **Stale job count** | Jobs with no activity in > 7 days | Minimize |

### 1.3 Quality Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Score accuracy** | Correlation between fit score and actual outcome (advance vs. not) | Improve over time |
| **Template effectiveness** | Response rate by template ID | Identify top performers |
| **Asset approval rate** | Share of generated assets approved without major edits | 70%+ |
| **Claim compliance rate** | Share of generated assets with zero unverified claims | 100% |

### 1.4 Outcome Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Total comp achieved** | Base + bonus + equity value of accepted offer | >= $180K base |
| **Comp vs. target** | Actual comp / target comp | >= 100% |
| **Role fit score** | Self-assessed fit after 90 days (if applicable) | >= 8/10 |

---

## 2. Scoring Calibration Approach

### 2.1 Initial Calibration (Before Data)

The scoring engine starts with weights defined in MASTER_PLAN.md Section 9:

| Category | Weight | What It Measures |
|----------|--------|-----------------|
| Role scope and authority | 30 | Systems ownership, strategy, cross-functional leverage |
| Compensation and benefits | 25 | Base >= $150K, medical/dental, 401(k), bonus, equity |
| Company stage and ability to pay | 20 | Penalize seed; reward established |
| Domain fit | 15 | Growth systems, lifecycle, GTM ops, ecom/B2C |
| Risk flags | -10 (max) | "Miracle needed," vague scope, unrealistic KPIs |

The initial weights are based on the user's stated priorities. They are hypotheses, not ground truth.

### 2.2 Calibration Protocol

**When:** After every 25 scored jobs (or weekly, whichever comes first).

**Process:**

1. **Export scored jobs with outcomes.** For each scored job, record: fit score, fit label (Pursue/Maybe/Pass), and actual outcome (advanced, stalled, rejected, withdrawn, or pending).

2. **Compute confusion matrix.**

   |  | Actually Good Fit | Actually Bad Fit |
   |--|------------------|-----------------|
   | **Scored Pursue** | True Positive | False Positive |
   | **Scored Pass** | False Negative | True Negative |

   "Actually Good Fit" = advanced to Screen or beyond, or upon human review, was clearly a strong match.
   "Actually Bad Fit" = resulted in mismatch, rejection for fit reasons, or upon review was clearly wrong.

3. **Analyze errors.**
   - For each False Positive: what signals did the scorer miss? (e.g., JD said "own paid media" but scorer missed it)
   - For each False Negative: what signals did the scorer underweight? (e.g., great role scope but low comp signal caused a Pass)

4. **Adjust weights.**
   - If False Positives cluster around a category (e.g., company stage), increase that category's weight or add a new disqualifier rule.
   - If False Negatives cluster around a category (e.g., domain fit), decrease that category's weight or widen the "Maybe" band.

5. **Record the adjustment** in DECISIONS.md with before/after weights, the data that motivated the change, and the expected impact.

### 2.3 Calibration Targets

| Band | Score Range | Expected Pursue Rate | Expected Advance Rate |
|------|-----------|---------------------|----------------------|
| High confidence | 75-100 | 90%+ | 40%+ |
| Medium confidence | 50-74 | 50-70% | 20%+ |
| Low confidence | 25-49 | 10-30% | Review for false negatives |
| Disqualified | 0-24 or hard DQ | 0% | N/A |

---

## 3. Template Testing Methodology

### 3.1 Template Inventory

Each template has a unique ID and tracks these attributes:

| Attribute | Description |
|-----------|-------------|
| `templateId` | Unique identifier |
| `assetType` | outreach_email, connect_note, cover_letter, growth_memo |
| `version` | Incremented on each edit |
| `createdDate` | When this version was created |
| `variables` | List of required input variables |
| `tone` | Direct, consultative, executive, etc. |
| `hypothesis` | What this template is designed to test |

### 3.2 Testing Approach

**Phase 1: Sequential testing (pre-M4)**

Before the experimentation framework is built, test templates sequentially:

1. Use Template A for 10 outreach messages. Record response rate.
2. Switch to Template B for the next 10. Record response rate.
3. Compare. Acknowledge that sequential testing has confounds (different jobs, different time periods).

**Phase 2: A/B testing (M4)**

Once the experiment framework is built:

1. Define an experiment: Template A vs. Template B for outreach_email.
2. For each new outreach, the system randomly assigns a variant.
3. Track outcomes per variant: response, screen, interview, offer.
4. After N observations (minimum 10 per variant), compute conversion rates with confidence intervals.

### 3.3 What Counts as a Template Win

A template variant "wins" if it produces a statistically meaningful improvement in the primary metric for that asset type:

| Asset Type | Primary Metric | Secondary Metric |
|------------|---------------|-----------------|
| Outreach email | Response rate | Screen rate |
| Connect note | Connection accept rate | Response rate |
| Cover letter | Screen rate | Interview advance rate |
| Growth memo | Interview advance rate | Offer rate |

### 3.4 Minimum Sample Size

Given the low volume of a single-person job search, statistical significance is difficult. Use these practical thresholds:

- **Directional signal:** 10+ observations per variant. Useful for eliminating clearly bad templates.
- **Moderate confidence:** 20+ observations per variant. Useful for choosing between competitive templates.
- **High confidence:** 50+ observations per variant. Unlikely to achieve for a single search; relevant only if productized.

When sample sizes are small, supplement quantitative data with qualitative review (does the output read well? does it match the user's voice?).

---

## 4. Experiment Design

### 4.1 Experiment Types

| Type | Description | When to Use |
|------|-------------|-------------|
| **A/B test** | Two variants, random assignment | Template comparison |
| **Before/after** | Change a parameter, compare periods | Scoring weight adjustment |
| **Multivariate** | Multiple variables changed simultaneously | Template + model combinations (future) |

### 4.2 Experiment Lifecycle

1. **Hypothesis:** "Template B will produce a higher response rate than Template A because it leads with a specific company insight."
2. **Design:** Define variants, assignment method, sample size target, success metric, duration.
3. **Run:** System assigns variants; user executes outreach.
4. **Measure:** After target sample size or duration, compute results.
5. **Decide:** Adopt winner, iterate on loser, or declare inconclusive.
6. **Record:** Log the experiment, results, and decision in the experiment log.

### 4.3 Guardrails for Experiments

- Never run more than 2 active experiments simultaneously (confounding risk + cognitive load).
- Every experiment must have a pre-defined end condition (sample size or date).
- If a variant is clearly underperforming (0 responses after 5+ sends), stop the experiment early and investigate.

---

## 5. Model Evaluation (Future -- When Real APIs Are Connected)

### 5.1 Evaluation Dimensions

| Dimension | How to Measure |
|-----------|---------------|
| **Output quality** | Human rating 1-5 on relevance, tone, accuracy, claim compliance |
| **Cost** | Tokens used * price per token |
| **Latency** | Time from request to complete response |
| **Claim compliance** | Automated check: does output reference only ledger claims? |

### 5.2 Model Comparison Protocol

1. For each asset type, generate the same output with 2-3 models using the same template and inputs.
2. Rate outputs blind (without knowing which model produced which).
3. Compute quality-per-dollar: quality score / cost.
4. Default to the model with the best quality-per-dollar ratio for each asset type.

---

## 6. Reporting Cadence

| Report | Frequency | Contents |
|--------|-----------|----------|
| Daily glance | Daily | Pipeline counts, overdue follow-ups, stale jobs |
| Weekly review | Weekly | Funnel conversion rates, scoring accuracy check, template performance |
| Calibration review | Every 25 scored jobs | Confusion matrix, weight adjustments, false positive/negative analysis |
| Experiment report | Per experiment completion | Hypothesis, results, decision, next steps |
