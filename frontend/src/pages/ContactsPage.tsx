import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Trash2,
  Edit2,
  MessageSquare,
  Tag,
  Phone,
  Mail,
  MoreHorizontal,
  CheckCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { Contact } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../lib/utils';

export const ContactsPage: React.FC<{ onStartChat?: (contactId: string) => void }> = ({ onStartChat }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    tags: '',
    notes: '',
  });

  const { success, error } = useToast();

  useEffect(() => {
    loadContacts();
  }, [search, selectedTag]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const res = await api.contacts.getList({
        search: search || undefined,
        tag: selectedTag !== 'all' ? selectedTag : undefined,
      });
      if (res.data) setContacts(res.data);
    } catch (e: any) {
      error('Failed to load contacts', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({ name: '', phoneNumber: '', email: '', tags: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || '',
      tags: (contact.tags || []).join(', '),
      notes: contact.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber) {
      error('Validation Error', 'Name and WhatsApp phone number are required.');
      return;
    }

    const payload = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      notes: formData.notes,
    };

    try {
      if (editingContact) {
        await api.contacts.update(editingContact._id, payload);
        success('Contact Updated', `${formData.name} was successfully updated.`);
      } else {
        await api.contacts.create(payload);
        success('Contact Created', `${formData.name} was added to contacts.`);
      }
      setIsModalOpen(false);
      loadContacts();
    } catch (err: any) {
      error('Failed to save', err.message);
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await api.contacts.delete(contact._id);
        success('Contact Deleted', `${contact.name} was removed.`);
        loadContacts();
      } catch (err: any) {
        error('Failed to delete', err.message);
      }
    }
  };

  const handleExportCsv = () => {
    window.open(api.contacts.getCsvExportUrl(), '_blank');
    success('Export Started', 'Downloading contacts CSV file...');
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contacts Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your registered WhatsApp customer contacts, tags, and conversation history
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportCsv}>
            Export CSV
          </Button>
          <Button variant="whatsapp" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Tags:</span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
              selectedTag === 'all'
                ? 'bg-[#128C7E] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Contacts
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors shrink-0 ${
                selectedTag === tag
                  ? 'bg-[#128C7E] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </Card>

      {/* Contacts Table */}
      <Card className="p-0 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-6">WhatsApp Number</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Tags</th>
                <th className="py-3.5 px-6">Last Interaction</th>
                <th className="py-3.5 px-6">Notes</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No contacts found matching your query.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`}
                          alt={contact.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{contact.name}</p>
                          <span className="text-[10px] text-emerald-600 font-semibold uppercase">Verified</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{contact.phoneNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 text-slate-600">
                      {contact.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          <span>{contact.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {(contact.tags || []).map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-6 text-slate-500">
                      {formatRelativeTime(contact.lastInteractionAt)}
                    </td>

                    <td className="py-3.5 px-6 text-slate-500 max-w-xs truncate">
                      {contact.notes || <span className="text-slate-300 italic">No notes</span>}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(contact)}
                          title="Edit Contact"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact)}
                          title="Delete Contact"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContact ? 'Edit WhatsApp Contact' : 'Add New WhatsApp Contact'}
        subtitle="Manage customer profile and metadata"
      >
        <form onSubmit={handleSaveContact} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone Number * (E.164)</label>
            <input
              type="text"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="e.g. +14155552671"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g. VIP, Prospect, Enterprise"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal business notes regarding this client..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="whatsapp">
              {editingContact ? 'Update Contact' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
