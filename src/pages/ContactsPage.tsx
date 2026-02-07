import { useState, useMemo, type FormEvent } from 'react';
import { useStore } from '../store/useStore';
import {
  UserPlus,
  Search,
  Mail,
  Linkedin,
  Users,
  ChevronRight,
  ArrowLeft,
  X,
  Phone,
  Activity,
  Clock,
} from 'lucide-react';
import type { Contact, ContactRelationship } from '../types';

const RELATIONSHIP_TYPES: ContactRelationship[] = ['Recruiter', 'Hiring Manager', 'Referrer', 'Peer', 'Executive', 'Other'];

const RELATIONSHIP_COLORS: Record<ContactRelationship, string> = {
  Recruiter: 'bg-blue-50 text-blue-700 border-blue-200',
  'Hiring Manager': 'bg-violet-50 text-violet-700 border-violet-200',
  Referrer: 'bg-green-50 text-green-700 border-green-200',
  Peer: 'bg-amber-50 text-amber-700 border-amber-200',
  Executive: 'bg-rose-50 text-rose-700 border-rose-200',
  Other: 'bg-neutral-50 text-neutral-600 border-neutral-200',
};

export function ContactsPage() {
  const contacts = useStore((s) => s.contacts);
  const companies = useStore((s) => s.companies);
  const activities = useStore((s) => s.activities);
  const addContact = useStore((s) => s.addContact);

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterRelationship, setFilterRelationship] = useState<ContactRelationship | ''>('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formLinkedIn, setFormLinkedIn] = useState('');
  const [formRelationship, setFormRelationship] = useState<ContactRelationship>('Other');

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q);

      const matchesFilter = !filterRelationship || c.relationship === filterRelationship;

      return matchesSearch && matchesFilter;
    });
  }, [contacts, search, filterRelationship]);

  const resetForm = () => {
    setFormName('');
    setFormRole('');
    setFormCompany('');
    setFormEmail('');
    setFormLinkedIn('');
    setFormRelationship('Other');
    setShowAdd(false);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const company = companies.find((c) => c.name.toLowerCase() === formCompany.toLowerCase());
    await addContact({
      name: formName.trim(),
      role: formRole.trim() || undefined,
      company: formCompany.trim() || undefined,
      companyId: company?.id,
      email: formEmail.trim() || undefined,
      linkedIn: formLinkedIn.trim() || undefined,
      relationship: formRelationship,
    });
    resetForm();
  };

  // Contact detail view
  if (selectedContact) {
    const contactActivities = activities
      .filter((a) => a.contactId === selectedContact.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedContact(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-h2 text-neutral-900">Contact Detail</h2>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{selectedContact.name}</h3>
              {selectedContact.role && (
                <p className="text-sm text-neutral-500">
                  {selectedContact.role}{selectedContact.company ? ` at ${selectedContact.company}` : ''}
                </p>
              )}
              {!selectedContact.role && selectedContact.company && (
                <p className="text-sm text-neutral-500">{selectedContact.company}</p>
              )}
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${RELATIONSHIP_COLORS[selectedContact.relationship]}`}>
              {selectedContact.relationship}
            </span>
          </div>

          <div className="space-y-2 pt-3 border-t border-neutral-100">
            {selectedContact.email && (
              <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                <Mail size={14} className="text-neutral-400" />
                {selectedContact.email}
              </a>
            )}
            {selectedContact.linkedIn && (
              <a href={selectedContact.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                <Linkedin size={14} className="text-neutral-400" />
                LinkedIn Profile
              </a>
            )}
            {selectedContact.phone && (
              <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                <Phone size={14} className="text-neutral-400" />
                {selectedContact.phone}
              </a>
            )}
          </div>
        </div>

        {/* Activity History */}
        <div>
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity size={14} />
            Activity History ({contactActivities.length})
          </h4>

          {contactActivities.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm text-center">
              <Activity size={20} className="text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-500">No activity history with this contact</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contactActivities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-neutral-700">{activity.channel}</span>
                    <span className="text-[11px] text-neutral-400">
                      {activity.direction === 'Outbound' ? 'Sent' : 'Received'}
                    </span>
                    {activity.outcome && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        activity.outcome === 'Reply Received' ? 'bg-green-50 text-green-700' :
                        activity.outcome === 'No Response' ? 'bg-neutral-100 text-neutral-500' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {activity.outcome}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-400 ml-auto">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2">{activity.content}</p>
                  {activity.followUpDate && (
                    <p className="text-[11px] text-amber-600 flex items-center gap-0.5 mt-1">
                      <Clock size={10} />
                      Follow-up: {new Date(activity.followUpDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Contact list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 text-neutral-900">Contacts</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          {showAdd ? <X size={14} /> : <UserPlus size={14} />}
          {showAdd ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        <select
          value={filterRelationship}
          onChange={(e) => setFilterRelationship(e.target.value as ContactRelationship | '')}
          className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
        >
          <option value="">All</option>
          {RELATIONSHIP_TYPES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Quick Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm space-y-3">
          <h3 className="text-h3 text-neutral-900">Quick Add Contact</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Name *"
              required
              className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <input
              type="text"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              placeholder="Role"
              className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <input
            type="text"
            value={formCompany}
            onChange={(e) => setFormCompany(e.target.value)}
            placeholder="Company"
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="Email"
              className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
            <input
              type="text"
              value={formLinkedIn}
              onChange={(e) => setFormLinkedIn(e.target.value)}
              placeholder="LinkedIn URL"
              className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={formRelationship}
              onChange={(e) => setFormRelationship(e.target.value as ContactRelationship)}
              className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
            >
              {RELATIONSHIP_TYPES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!formName.trim()}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              Add Contact
            </button>
          </div>
        </form>
      )}

      {/* Contact List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-neutral-100 rounded-lg flex items-center justify-center mb-3">
            <Users size={24} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 mb-1">
            {contacts.length === 0 ? 'No contacts yet' : 'No matches found'}
          </p>
          {contacts.length === 0 && (
            <p className="text-xs text-neutral-400">
              Add contacts from the CRM tab in a job workspace, or use the Add button above.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="w-full text-left bg-white rounded-lg border border-neutral-200 p-3 shadow-sm hover:shadow-md hover:border-neutral-300 transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-neutral-900 truncate">{contact.name}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    {contact.role}{contact.role && contact.company ? ' at ' : ''}{contact.company}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${RELATIONSHIP_COLORS[contact.relationship]}`}>
                    {contact.relationship}
                  </span>
                  <ChevronRight size={16} className="text-neutral-300" />
                </div>
              </div>
              {(contact.email || contact.linkedIn) && (
                <div className="flex items-center gap-3 mt-2">
                  {contact.email && (
                    <span className="text-[11px] text-neutral-400 flex items-center gap-0.5 truncate">
                      <Mail size={10} />
                      {contact.email}
                    </span>
                  )}
                  {contact.linkedIn && (
                    <span className="text-[11px] text-brand-600 flex items-center gap-0.5">
                      <Linkedin size={10} />
                      LinkedIn
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
