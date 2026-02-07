---
id: outreach-email-v1
type: email
version: 1
default_model_tier: tier-1
tone: "Proof-led, Alen-style (direct, no fluff, evidence-based), Hormozi clarity (clear offer/proof framing). No em dashes."
variables:
  - company_name
  - contact_name
  - contact_role
  - job_title
  - top_claim_1
  - top_claim_2
  - company_insight
  - open_loop
---

Subject: {{job_title}} at {{company_name}} // proof attached

{{contact_name}},

I saw {{company_name}} is hiring for {{job_title}}. Before I applied through the portal, I wanted to send you two data points that speak louder than a resume.

**Proof point 1:** {{top_claim_1}}

**Proof point 2:** {{top_claim_2}}

I dug into {{company_name}} before writing this. {{company_insight}}

That context matters because it tells me exactly where I can move the needle for your team.

{{open_loop}}

If any of that lands, I am happy to walk through the specifics in a 15-minute call. No pitch, just evidence.

Best,
[Your Name]
