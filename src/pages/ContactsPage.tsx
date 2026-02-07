import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Mail, Linkedin, User } from 'lucide-react';
import type { ContactRelationship } from '../types';

export function ContactsPage() {
  const contacts = useStore((s) => s.contacts);
  const companies = useStore((s) => s.companies);
  const addContact = useStore((s) => s.addContact);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    linkedIn: '',
    relationship: 'Other' as ContactRelationship,
  });

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q)
    );
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const company = companies.find((c) => c.name.toLowerCase() === form.company.toLowerCase());
    await addContact({
      ...form,
      companyId: company?.id,
    });
    setForm({ name: '', role: '', company: '', email: '', linkedIn: '', relationship: 'Other' });
    setShowAdd(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Contacts</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg text-sm"
        />
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-neutral-200 p-3 space-y-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Role"
              className="px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
            />
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Company"
              className="px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
          />
          <input
            value={form.linkedIn}
            onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
            placeholder="LinkedIn URL"
            className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm"
          />
          <select
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value as ContactRelationship })}
            className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-sm bg-white"
          >
            <option value="Recruiter">Recruiter</option>
            <option value="Hiring Manager">Hiring Manager</option>
            <option value="Referrer">Referrer</option>
            <option value="Peer">Peer</option>
            <option value="Executive">Executive</option>
            <option value="Other">Other</option>
          </select>
          <button type="submit" className="w-full bg-brand-600 text-white py-1.5 rounded-lg text-sm font-medium">
            Add Contact
          </button>
        </form>
      )}

      {/* Contact list */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <User size={28} className="text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">{contacts.length === 0 ? 'No contacts yet' : 'No matches'}</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((contact) => (
          <div key={contact.id} className="bg-white rounded-xl border border-neutral-200 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{contact.name}</p>
                <p className="text-xs text-neutral-500">
                  {contact.role}{contact.role && contact.company ? ' at ' : ''}{contact.company}
                </p>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                {contact.relationship}
              </span>
            </div>
            {(contact.email || contact.linkedIn) && (
              <div className="flex gap-3 mt-2">
                {contact.email && (
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <Mail size={10} /> {contact.email}
                  </span>
                )}
                {contact.linkedIn && (
                  <a
                    href={contact.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-brand-600 flex items-center gap-1"
                  >
                    <Linkedin size={10} /> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
