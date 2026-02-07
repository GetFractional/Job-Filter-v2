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
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateOutreachEmail } from '../../lib/assets';
import type {
  Job,
  ContactRelationship,
  ActivityChannel,
  ActivityOutcome,
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

export function CRMTab({ job }: CRMTabProps) {
  const allContacts = useStore((s) => s.contacts);
  const allActivities = useStore((s) => s.activities);
  const claims = useStore((s) => s.claims);
  const addContact = useStore((s) => s.addContact);
  const addActivity = useStore((s) => s.addActivity);

  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactLinkedIn, setContactLinkedIn] = useState('');
  const [contactRelationship, setContactRelationship] = useState<ContactRelationship>('Recruiter');

  // Activity form state
  const [actChannel, setActChannel] = useState<ActivityChannel>('Email');
  const [actDirection, setActDirection] = useState<'Outbound' | 'Inbound'>('Outbound');
  const [actContent, setActContent] = useState('');
  const [actOutcome, setActOutcome] = useState<ActivityOutcome>('Sent');
  const [actContactId, setActContactId] = useState('');
  const [actFollowUpDate, setActFollowUpDate] = useState('');

  // Filter contacts linked to this job's company
  const jobContacts = useMemo(
    () => allContacts.filter((c) => c.companyId === job.companyId || c.company?.toLowerCase() === job.company.toLowerCase()),
    [allContacts, job.companyId, job.company]
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
    setContactName('');
    setContactRole('');
    setContactEmail('');
    setContactLinkedIn('');
    setContactRelationship('Recruiter');
    setShowAddContact(false);
  }, []);

  const handleAddContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;
    await addContact({
      name: contactName.trim(),
      role: contactRole.trim() || undefined,
      companyId: job.companyId,
      company: job.company,
      email: contactEmail.trim() || undefined,
      linkedIn: contactLinkedIn.trim() || undefined,
      relationship: contactRelationship,
    });
    resetContactForm();
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
    const content = generateOutreachEmail({
      job,
      contactName: selectedContact?.name,
      contactRole: selectedContact?.role,
      claims,
      research: job.researchBrief,
    });
    setActContent(content);
  }, [job, claims, actContactId, jobContacts]);

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Follow-up Alerts */}
      {followUpAlerts.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
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
                    Follow up{contact ? ` with ${contact.name}` : ''} - {new Date(a.followUpDate!).toLocaleDateString()}
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
            Contacts
          </h3>
          <button
            onClick={() => setShowAddContact(!showAddContact)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100"
          >
            {showAddContact ? <X size={10} /> : <UserPlus size={10} />}
            {showAddContact ? 'Cancel' : 'Add'}
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddContact && (
          <form onSubmit={handleAddContact} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name *"
                required
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <input
                type="text"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                placeholder="Role"
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email"
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <input
                type="text"
                value={contactLinkedIn}
                onChange={(e) => setContactLinkedIn(e.target.value)}
                placeholder="LinkedIn URL"
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
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
                disabled={!contactName.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Contact Cards */}
        {jobContacts.length === 0 && !showAddContact ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm text-center">
            <Users size={20} className="text-neutral-300 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">No contacts yet for {job.company}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobContacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-neutral-900">{contact.name}</h5>
                    {contact.role && <p className="text-xs text-neutral-500">{contact.role}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RELATIONSHIP_COLORS[contact.relationship]}`}>
                    {contact.relationship}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-[10px] text-brand-600 flex items-center gap-0.5 hover:underline">
                      <Mail size={10} />
                      {contact.email}
                    </a>
                  )}
                  {contact.linkedIn && (
                    <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 flex items-center gap-0.5 hover:underline">
                      <Linkedin size={10} />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Activity Log Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} />
            Activity Log
          </h3>
          <button
            onClick={() => setShowAddActivity(!showAddActivity)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100"
          >
            {showAddActivity ? <X size={10} /> : <Plus size={10} />}
            {showAddActivity ? 'Cancel' : 'Add'}
          </button>
        </div>

        {/* Add Activity Form */}
        {showAddActivity && (
          <form onSubmit={handleAddActivity} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm mb-3 space-y-3">
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
                  <option key={c.id} value={c.id}>{c.name}</option>
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
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
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
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm text-center">
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
                <div key={activity.id} className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
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
                      <span className="text-[10px] text-neutral-500 truncate">
                        {activity.direction === 'Outbound' ? 'to' : 'from'} {contact.name}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400 ml-auto shrink-0">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2 ml-8">{activity.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 ml-8">
                    {activity.outcome && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${outcomeColor}`}>
                        {activity.outcome}
                      </span>
                    )}
                    {activity.followUpDate && (
                      <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
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
