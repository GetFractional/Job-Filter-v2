import { useState, useMemo, useCallback, type FormEvent } from 'react';
import {
  UserPlus,
  Mail,
  Linkedin,
  Phone,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertCircle,
  Users,
  Activity,
  Send,
  Plus,
  X,
  Link2,
  Unlink,
  Building2,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateOutreachEmail } from '../../lib/assets';
import type {
  Job,
  Contact,
  ContactRelationship,
  ActivityChannel,
  ActivityOutcome,
  Company,
} from '../../types';

interface CRMTabProps {
  job: Job;
}

const RELATIONSHIP_TYPES: ContactRelationship[] = ['Recruiter', 'Hiring Manager', 'Referrer', 'Peer', 'Executive', 'Other'];

const CHANNELS: ActivityChannel[] = ['Email', 'LinkedIn', 'Text', 'Phone', 'In-person', 'Other'];

const OUTCOMES: ActivityOutcome[] = [
  'Sent', 'Reply Received', 'Call Scheduled', 'Screen Scheduled',
  'Interview Scheduled', 'Referral Offered', 'Rejected', 'No Response', 'Other',
];

const RELATIONSHIP_COLORS: Record<ContactRelationship, string> = {
  Recruiter: 'bg-blue-50 text-blue-700 border-blue-200',
  'Hiring Manager': 'bg-violet-50 text-violet-700 border-violet-200',
  Referrer: 'bg-green-50 text-green-700 border-green-200',
  Peer: 'bg-amber-50 text-amber-700 border-amber-200',
  Executive: 'bg-rose-50 text-rose-700 border-rose-200',
  Other: 'bg-neutral-50 text-neutral-600 border-neutral-200',
};

const CHANNEL_ICONS: Record<ActivityChannel, typeof Mail> = {
  Email: Mail,
  LinkedIn: Linkedin,
  Text: MessageSquare,
  Phone: Phone,
  'In-person': Users,
  Other: MessageSquare,
};

const OUTCOME_COLORS: Record<ActivityOutcome, string> = {
  Sent: 'bg-blue-50 text-blue-700',
  'Reply Received': 'bg-green-50 text-green-700',
  'Call Scheduled': 'bg-violet-50 text-violet-700',
  'Screen Scheduled': 'bg-brand-50 text-brand-700',
  'Interview Scheduled': 'bg-emerald-50 text-emerald-700',
  'Referral Offered': 'bg-cyan-50 text-cyan-700',
  Rejected: 'bg-red-50 text-red-700',
  'No Response': 'bg-neutral-100 text-neutral-600',
  Other: 'bg-neutral-50 text-neutral-600',
};

function contactDisplayName(c: Contact): string {
  return `${c.firstName} ${c.lastName}`.trim() || 'Unnamed';
}

function contactInitials(c: Contact): string {
  const first = c.firstName?.[0] || '';
  const last = c.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function CompanyCard({ company }: { company: Company }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-brand-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">{company.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              {company.stage !== 'Unknown' && (
                <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                  {company.stage}
                </span>
              )}
              {company.industry && (
                <span className="text-[11px] text-neutral-400">{company.industry}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded text-neutral-400 hover:text-neutral-600"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
              <Globe size={12} className="text-neutral-400" />
              {company.website}
            </a>
          )}
          {company.businessModel && (
            <p className="text-xs text-neutral-600"><span className="font-medium text-neutral-700">Model:</span> {company.businessModel}</p>
          )}
          {company.riskFlags.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-red-600">Risk flags:</span>
              <ul className="mt-0.5">
                {company.riskFlags.map((f, i) => (
                  <li key={i} className="text-[11px] text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {company.notes && <p className="text-xs text-neutral-500 italic">{company.notes}</p>}
        </div>
      )}
    </div>
  );
}

export function CRMTab({ job }: CRMTabProps) {
  const allContacts = useStore((s) => s.contacts);
  const allActivities = useStore((s) => s.activities);
  const contactJobLinks = useStore((s) => s.contactJobLinks);
  const companies = useStore((s) => s.companies);
  const profile = useStore((s) => s.profile);
  const claims = useStore((s) => s.claims);
  const addContact = useStore((s) => s.addContact);
  const addActivity = useStore((s) => s.addActivity);
  const linkContactToJob = useStore((s) => s.linkContactToJob);
  const unlinkContactFromJob = useStore((s) => s.unlinkContactFromJob);

  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showLinkExisting, setShowLinkExisting] = useState(false);

  // Contact form state — first/last name
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactLinkedIn, setContactLinkedIn] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState<ContactRelationship>('Recruiter');
  const [contactNotes, setContactNotes] = useState('');

  // Activity form state
  const [actChannel, setActChannel] = useState<ActivityChannel>('Email');
  const [actDirection, setActDirection] = useState<'Outbound' | 'Inbound'>('Outbound');
  const [actContent, setActContent] = useState('');
  const [actOutcome, setActOutcome] = useState<ActivityOutcome>('Sent');
  const [actContactId, setActContactId] = useState('');
  const [actFollowUpDate, setActFollowUpDate] = useState('');

  // Company entity for this job
  const jobCompany = useMemo(
    () => companies.find((c) => c.id === job.companyId),
    [companies, job.companyId]
  );

  // Get linked contact IDs for this job
  const linkedContactIds = useMemo(
    () => new Set(contactJobLinks.filter((l) => l.jobId === job.id).map((l) => l.contactId)),
    [contactJobLinks, job.id]
  );

  // Contacts linked to this job (via junction) OR company match (legacy compat)
  const jobContacts = useMemo(() => {
    return allContacts.filter((c) => {
      if (linkedContactIds.has(c.id)) return true;
      // Legacy: company name match
      if (c.companyId === job.companyId && job.companyId) return true;
      if (c.company && c.company.toLowerCase() === job.company.toLowerCase()) return true;
      return false;
    });
  }, [allContacts, linkedContactIds, job.companyId, job.company]);

  // Contacts NOT linked (for the "link existing" picker)
  const unlinkableContacts = useMemo(
    () => allContacts.filter((c) => !jobContacts.some((jc) => jc.id === c.id)),
    [allContacts, jobContacts]
  );

  // Filter activities for this job
  const jobActivities = useMemo(
    () => allActivities
      .filter((a) => a.jobId === job.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allActivities, job.id]
  );

  // Follow-up alerts
  const followUpAlerts = useMemo(() => {
    const now = new Date();
    return jobActivities.filter((a) => {
      if (!a.followUpDate) return false;
      const followUp = new Date(a.followUpDate);
      const diffDays = (followUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 3 && diffDays >= -7;
    });
  }, [jobActivities]);

  const resetContactForm = useCallback(() => {
    setContactFirstName('');
    setContactLastName('');
    setContactRole('');
    setContactEmail('');
    setContactLinkedIn('');
    setContactPhone('');
    setContactRelationship('Recruiter');
    setContactNotes('');
    setShowAddContact(false);
  }, []);

  const handleAddContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactFirstName.trim()) return;
    const contact = await addContact({
      firstName: contactFirstName.trim(),
      lastName: contactLastName.trim(),
      role: contactRole.trim() || undefined,
      companyId: job.companyId,
      company: job.company,
      email: contactEmail.trim() || undefined,
      linkedIn: contactLinkedIn.trim() || undefined,
      phone: contactPhone.trim() || undefined,
      relationship: contactRelationship,
      notes: contactNotes.trim() || undefined,
    });
    // Auto-link to this job
    await linkContactToJob(contact.id, job.id);
    resetContactForm();
  };

  const handleLinkExisting = async (contactId: string) => {
    await linkContactToJob(contactId, job.id);
    setShowLinkExisting(false);
  };

  const handleUnlink = async (contactId: string) => {
    await unlinkContactFromJob(contactId, job.id);
  };

  const handleAddActivity = async (e: FormEvent) => {
    e.preventDefault();
    if (!actContent.trim()) return;
    await addActivity({
      jobId: job.id,
      contactId: actContactId || undefined,
      companyId: job.companyId,
      channel: actChannel,
      direction: actDirection,
      content: actContent.trim(),
      outcome: actOutcome,
      followUpDate: actFollowUpDate || undefined,
    });
    setActContent('');
    setActFollowUpDate('');
    setShowAddActivity(false);
  };

  const handleGenerateMessage = useCallback(() => {
    const selectedContact = jobContacts.find((c) => c.id === actContactId);
    const userName = profile?.name?.trim() || 'Candidate';
    const content = generateOutreachEmail({
      job,
      userName,
      contactName: selectedContact ? contactDisplayName(selectedContact) : undefined,
      contactRole: selectedContact?.role,
      claims,
      research: job.researchBrief,
    });
    setActContent(content);
  }, [job, profile, claims, actContactId, jobContacts]);

  return (
    <div className="py-4 space-y-6">
      {/* Company Entity Card */}
      {jobCompany && (
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Building2 size={14} />
            Company
          </h3>
          <CompanyCard company={jobCompany} />
        </section>
      )}

      {/* Follow-up Alerts */}
      {followUpAlerts.length > 0 && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} />
            Follow-up Alerts
          </h4>
          <div className="space-y-2">
            {followUpAlerts.map((a) => {
              const contact = allContacts.find((c) => c.id === a.contactId);
              return (
                <div key={a.id} className="flex items-center gap-2 text-sm text-amber-800">
                  <Clock size={12} className="shrink-0" />
                  <span className="truncate">
                    Follow up{contact ? ` with ${contactDisplayName(contact)}` : ''} - {new Date(a.followUpDate!).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contacts Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} />
            Contacts ({jobContacts.length})
          </h3>
          <div className="flex items-center gap-1.5">
            {unlinkableContacts.length > 0 && (
              <button
                onClick={() => { setShowLinkExisting(!showLinkExisting); setShowAddContact(false); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100"
              >
                <Link2 size={10} />
                Link
              </button>
            )}
            <button
              onClick={() => { setShowAddContact(!showAddContact); setShowLinkExisting(false); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100"
            >
              {showAddContact ? <X size={10} /> : <UserPlus size={10} />}
              {showAddContact ? 'Cancel' : 'New'}
            </button>
          </div>
        </div>

        {/* Link Existing Contact Picker */}
        {showLinkExisting && (
          <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm mb-3">
            <h4 className="text-xs font-medium text-neutral-700 mb-2">Link existing contact to this job</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {unlinkableContacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleLinkExisting(c.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 flex items-center justify-between group"
                >
                  <div>
                    <span className="text-sm font-medium text-neutral-800">{contactDisplayName(c)}</span>
                    {c.company && <span className="text-xs text-neutral-400 ml-2">{c.company}</span>}
                  </div>
                  <Link2 size={12} className="text-neutral-300 group-hover:text-brand-500" />
                </button>
              ))}
              {unlinkableContacts.length === 0 && (
                <p className="text-xs text-neutral-400 py-2 text-center">All contacts already linked</p>
              )}
            </div>
          </div>
        )}

        {/* Add Contact Form */}
        {showAddContact && (
          <form onSubmit={handleAddContact} className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-600 mb-1 block">First Name *</label>
                <input
                  type="text"
                  value={contactFirstName}
                  onChange={(e) => setContactFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-600 mb-1 block">Last Name</label>
                <input
                  type="text"
                  value={contactLastName}
                  onChange={(e) => setContactLastName(e.target.value)}
                  placeholder="Smith"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>
            <input
              type="text"
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              placeholder="Role (e.g. Hiring Manager)"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email"
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone"
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
            <input
              type="text"
              value={contactLinkedIn}
              onChange={(e) => setContactLinkedIn(e.target.value)}
              placeholder="LinkedIn URL"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <textarea
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={contactRelationship}
                onChange={(e) => setContactRelationship(e.target.value as ContactRelationship)}
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
              >
                {RELATIONSHIP_TYPES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!contactFirstName.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Contact Cards */}
        {jobContacts.length === 0 && !showAddContact && !showLinkExisting ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm text-center">
            <Users size={20} className="text-neutral-300 mx-auto mb-2" />
            <p className="text-xs text-neutral-500 mb-1">No contacts yet for {job.company}</p>
            <p className="text-[11px] text-neutral-400">Add a new contact or link an existing one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobContacts.map((contact) => {
              const isLinked = linkedContactIds.has(contact.id);
              return (
                <div key={contact.id} className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0 text-[11px] font-bold text-brand-700">
                      {contactInitials(contact)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-semibold text-neutral-900 truncate">
                          {contactDisplayName(contact)}
                        </h5>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${RELATIONSHIP_COLORS[contact.relationship]}`}>
                          {contact.relationship}
                        </span>
                      </div>
                      {contact.role && <p className="text-xs text-neutral-500 mt-0.5">{contact.role}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-[11px] text-brand-600 flex items-center gap-0.5 hover:underline truncate">
                            <Mail size={10} />
                            {contact.email}
                          </a>
                        )}
                        {contact.linkedIn && (
                          <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[11px] text-brand-600 flex items-center gap-0.5 hover:underline">
                            <Linkedin size={10} />
                            LinkedIn
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="text-[11px] text-brand-600 flex items-center gap-0.5 hover:underline">
                            <Phone size={10} />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    {isLinked && (
                      <button
                        onClick={() => handleUnlink(contact.id)}
                        className="p-1 rounded text-neutral-300 hover:text-red-500 shrink-0"
                        title="Unlink from this job"
                      >
                        <Unlink size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Activity Log Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} />
            Activity Log ({jobActivities.length})
          </h3>
          <button
            onClick={() => setShowAddActivity(!showAddActivity)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100"
          >
            {showAddActivity ? <X size={10} /> : <Plus size={10} />}
            {showAddActivity ? 'Cancel' : 'Log'}
          </button>
        </div>

        {/* Add Activity Form */}
        {showAddActivity && (
          <form onSubmit={handleAddActivity} className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm mb-3 space-y-3">
            {/* Quick-log templates */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[11px] text-neutral-400 mr-1 self-center">Quick:</span>
              <button
                type="button"
                onClick={() => { setActChannel('Email'); setActDirection('Outbound'); setActOutcome('Sent'); setActContent('Sent initial outreach email.'); }}
                className="px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                Email Sent
              </button>
              <button
                type="button"
                onClick={() => { setActChannel('LinkedIn'); setActDirection('Outbound'); setActOutcome('Sent'); setActContent('Sent LinkedIn connection request with note.'); }}
                className="px-2 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                LinkedIn Sent
              </button>
              <button
                type="button"
                onClick={() => { setActChannel('Email'); setActDirection('Inbound'); setActOutcome('Reply Received'); setActContent('Received reply.'); }}
                className="px-2 py-1 text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100"
              >
                Got Reply
              </button>
              <button
                type="button"
                onClick={() => { setActChannel('Phone'); setActDirection('Inbound'); setActOutcome('Interview Scheduled'); setActContent('Interview scheduled.'); }}
                className="px-2 py-1 text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-md hover:bg-violet-100"
              >
                Interview Set
              </button>
              <button
                type="button"
                onClick={() => { setActChannel('Email'); setActDirection('Outbound'); setActOutcome('No Response'); setActContent('No response after follow-up.'); setActFollowUpDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]); }}
                className="px-2 py-1 text-[11px] font-medium bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-100"
              >
                No Response
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={actChannel}
                onChange={(e) => setActChannel(e.target.value as ActivityChannel)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
              <select
                value={actDirection}
                onChange={(e) => setActDirection(e.target.value as 'Outbound' | 'Inbound')}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
              >
                <option value="Outbound">Outbound</option>
                <option value="Inbound">Inbound</option>
              </select>
              <select
                value={actOutcome}
                onChange={(e) => setActOutcome(e.target.value as ActivityOutcome)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={actContactId}
                onChange={(e) => setActContactId(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
              >
                <option value="">Select contact...</option>
                {jobContacts.map((c) => (
                  <option key={c.id} value={c.id}>{contactDisplayName(c)}</option>
                ))}
              </select>
              <input
                type="date"
                value={actFollowUpDate}
                onChange={(e) => setActFollowUpDate(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                placeholder="Follow-up date"
              />
            </div>

            <textarea
              value={actContent}
              onChange={(e) => setActContent(e.target.value)}
              placeholder="Activity content / notes..."
              rows={4}
              required
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerateMessage}
                className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                <Send size={12} />
                Generate Message
              </button>
              <button
                type="submit"
                disabled={!actContent.trim()}
                className="ml-auto px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Log Activity
              </button>
            </div>
          </form>
        )}

        {/* Activity Cards */}
        {jobActivities.length === 0 && !showAddActivity ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm text-center">
            <Activity size={20} className="text-neutral-300 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">No activities logged yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobActivities.map((activity) => {
              const ChannelIcon = CHANNEL_ICONS[activity.channel] || MessageSquare;
              const contact = allContacts.find((c) => c.id === activity.contactId);
              const outcomeColor = activity.outcome ? OUTCOME_COLORS[activity.outcome] || 'bg-neutral-50 text-neutral-600' : '';

              return (
                <div key={activity.id} className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <ChannelIcon size={12} className="text-neutral-500" />
                    </div>
                    {activity.direction === 'Outbound' ? (
                      <ArrowUpRight size={12} className="text-blue-500 shrink-0" />
                    ) : (
                      <ArrowDownLeft size={12} className="text-green-500 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-neutral-700">{activity.channel}</span>
                    {contact && (
                      <span className="text-[11px] text-neutral-500 truncate">
                        {activity.direction === 'Outbound' ? 'to' : 'from'} {contactDisplayName(contact)}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-400 ml-auto shrink-0">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2 ml-8">{activity.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 ml-8">
                    {activity.outcome && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${outcomeColor}`}>
                        {activity.outcome}
                      </span>
                    )}
                    {activity.followUpDate && (
                      <span className="text-[11px] text-amber-600 flex items-center gap-0.5">
                        <Clock size={9} />
                        Follow-up: {new Date(activity.followUpDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
