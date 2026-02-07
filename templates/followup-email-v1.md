---
id: followup-email-v1
type: email
version: 1
default_model_tier: tier-2
tone: "Brief, respectful, adds new value. Not pushy. References original outreach without repeating it."
variables:
  - contact_name
  - company_name
  - original_outreach_date
  - new_insight
---

Subject: Re: quick follow-up on {{company_name}}

{{contact_name}},

I reached out on {{original_outreach_date}} about the role at {{company_name}}. I know inboxes are brutal, so I will keep this short.

Since my last note, I came across something worth sharing:

{{new_insight}}

I flagged it because it connects directly to the growth levers I outlined in my initial outreach. Happy to dig into the details if it is useful.

Either way, no pressure. I appreciate your time.

Best,
[Your Name]
