import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  AcademicCapIcon,
  PlusCircleIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PaperClipIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const GlassSelect = ({
  value,
  onChange,
  options = [],
  placeholder = '',
  className = '',
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const selected =
    options.find((o) => o.value === value) ||
    { label: placeholder || (options[0] && options[0].label) || '' };

  React.useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="
          flex h-11 w-full items-center justify-between gap-2
          rounded-full border border-white/25 bg-white/[0.04]
          px-4 text-xs text-white
          backdrop-blur-[8px]
          shadow-[inset_0_0_10px_rgba(255,255,255,0.18)]
          hover:bg.white/[0.08]
          transition-all
        "
      >
        <span className="truncate text-left">{selected.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 flex-shrink-0 text-white/80 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-0 z-40 mt-2 w-full
            rounded-2xl overflow-hidden
            border border-white/25 bg-black/[0.75]
            backdrop-blur-[14px]
            shadow-[inset_0_0_18px_rgba(255,255,255,0.22)]
          "
        >
          <ul className="max-h-56 overflow-y-auto py-1 text-xs text-white">
            {options.map((opt) => (
              <li key={String(opt.value)}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left transition-all ${
                    opt.value === value
                      ? 'bg-black/[0.50] font-semibold'
                      : 'hover:bg-black/[0.50]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


const Scholarship = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');

  return (
    <div className="mx-auto max-w-4xl pb-10">
      {/* Header + Tabs in one glass card */}
      <div
        className="
          mb-6 rounded-[1.75rem]
          border border-white/25
          bg-white/[0.04]
          px-5 py-5
          backdrop-blur-[12px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
        "
      >
        <h1 className="mb-4 text-2xl font-semibold text-white">
          Scholarship Center
        </h1>

        {/* Admin Tabs */}
        {user.role === 'admin' && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            <TabButton
              id="browse"
              label="Live Programs"
              active={activeTab}
              onClick={setActiveTab}
              icon={<AcademicCapIcon className="mr-2 h-5 w-5" />}
            />
            <TabButton
              id="manage"
              label="Create Program"
              active={activeTab}
              onClick={setActiveTab}
              icon={<PlusCircleIcon className="mr-2 h-5 w-5" />}
            />
            <TabButton
              id="applications"
              label="Review Applications"
              active={activeTab}
              onClick={setActiveTab}
              icon={<DocumentCheckIcon className="mr-2 h-5 w-5" />}
            />
          </div>
        )}

        {/* Student Tabs */}
        {user.role === 'student' && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            <TabButton
              id="browse"
              label="Available Scholarships"
              active={activeTab}
              onClick={setActiveTab}
              icon={<AcademicCapIcon className="mr-2 h-5 w-5" />}
            />
            <TabButton
              id="applications"
              label="My Applications"
              active={activeTab}
              onClick={setActiveTab}
              icon={<DocumentCheckIcon className="mr-2 h-5 w-5" />}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'browse' && (
        <BrowsePrograms user={user} isAdmin={user.role === 'admin'} />
      )}
      {activeTab === 'manage' && user.role === 'admin' && <ManagePrograms />}
      {activeTab === 'applications' && <ReviewApplications user={user} />}
    </div>
  );
};

const TabButton = ({ id, label, active, onClick, icon }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`
      flex h-11 items-center whitespace-nowrap
      rounded-full px-5 text-sm transition-all
      border
      ${
        active === id
          ? 'border-white/70 bg-white/[0.26] text-white shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]'
          : 'border-white/18 bg-white/[0.06] text-white/75 hover:bg-white/[0.14] hover:text-white'
      }
    `}
  >
    {icon} {label}
  </button>
);

// --- 1. BROWSE PROGRAMS (List with Quota & Edit/Delete) ---
const BrowsePrograms = ({ user, isAdmin }) => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/finance/programs');
      setPrograms(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Delete this program? This will also delete all associated applications.'
      )
    )
      return;
    try {
      await api.delete(`/finance/programs/${id}`);
      fetchData();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-5">
      {selectedProgram ? (
        <ApplicationForm
          program={selectedProgram}
          user={user}
          onBack={() => setSelectedProgram(null)}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {programs.length === 0 && (
              <button
                className="
                  h-11 w-full rounded-full border border-white/25
                  bg-white-500/80 text-sm text-white
                  shadow-[inset_0_0_18px_rgba(255,255,255,0.28)]
                  transition-all hover:bg-white-400/90 active:scale-[0.98]
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                No scholarship programs available.
              </button>
            )}
            {programs.map((p) => (
              <div
                key={p._id}
                className="
                  flex flex-col justify-between
                  rounded-2xl border border-white/20
                  bg-white/[0.03] p-5
                  backdrop-blur-[10px]
                  shadow-[inset_0_0_16px_rgba(255,255,255,0.16)]
                  transition
                  hover:border-white/45 hover:shadow-[inset_0_0_24px_rgba(255,255,255,0.22)]
                "
              >
                <div>
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {p.title}
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          p.status === 'Active'
                            ? 'bg-white-900/70 text-white-100'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {p.status}
                      </span>

                      {/* QUOTA BADGE */}
                      <span className="rounded-full border border-white-300/50 bg-white-500/15 px-2 py-0.5 text-[10px] text-white-100">
                        {p.awardedCount} / {p.quota} Filled
                      </span>
                    </div>
                  </div>

                  <p className="mb-4 min-h-[3rem] text-sm text-white/70">
                    {p.description}
                  </p>

                  <div className="mb-4 grid grid-cols-2 gap-y-2 text-xs text-white/80">
                    <div>
                      <span className="text-white/60">Category:</span>{' '}
                      <span className="text-white">{p.category}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Min Score:</span>{' '}
                      <span className="text-white">{p.minScore}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Funding:</span>{' '}
                      <span className="text-white">{p.fundingType}</span>
                    </div>

                    <div className="col-span-2 mt-2 border-t border-white/10 pt-2 text-[11px] text-white/55">
                      Open:{' '}
                      {new Date(p.openDate).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}{' '}
                      — Close:{' '}
                      {new Date(p.closeDate).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {/* Student Apply */}
                {user.role === 'student' && p.status === 'Active' && (
                  <button
                    type="button"
                    onClick={() => setSelectedProgram(p)}
                    className="
                      mt-1 h-11 w-full rounded-full
                      border border-white/30 bg-white/[0.2]
                      text-sm font-semibold text-white
                      shadow-[inset_0_0_18px_rgba(255,255,255,0.26)]
                      transition
                      hover:bg-white/[0.28]
                      active:scale-[0.98]
                    "
                  >
                    Apply Now
                  </button>
                )}

                {/* Admin actions */}
                {isAdmin && (
                  <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingProgram(p)}
                      className="
                        flex h-11 w-11 items-center justify-center
                        rounded-full border border-white/30
                        bg-white/[0.08] text-white/80
                        shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
                        hover:bg-white/[0.16] hover:text-white
                        transition
                      "
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      className="
                        flex h-11 w-11 items-center justify-center
                        rounded-full border border-white/30
                        bg-white/[0.08] text-white/80
                        shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
                        hover:bg-white/[0.16] hover:text-white
                        transition
                      "
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {editingProgram && (
            <EditProgramModal
              program={editingProgram}
              onClose={() => setEditingProgram(null)}
              onRefresh={fetchData}
            />
          )}
        </>
      )}
    </div>
  );
};

// --- 2. MANAGE PROGRAMS (Create Form) ---
const ManagePrograms = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Academic',
    fundingType: 'Fully Funded',
    quota: 10,
    minScore: 75,
    eligibleGrades: [10, 11, 12],
    openDate: new Date(),
    closeDate: new Date(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.minScore < 0 || formData.minScore > 100)
      return alert('Score must be 0-100');
    if (formData.closeDate <= formData.openDate)
      return alert('Close Date must be AFTER Open Date');

    try {
      await api.post('/finance/programs', { ...formData, status: 'Active' });
      alert('Program Created!');
      window.location.reload();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.message || 'Error'));
    }
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-sm text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.16)]';

  const textareaBase =
    'w-full rounded-2xl border border-white/25 bg-white/[0.04] p-3 text-sm text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_14px_rgba(255,255,255,0.16)]';

  return (
    <div
      className="
        rounded-[1.75rem] border border-white/25
        bg-white/[0.04] px-5 py-5
        backdrop-blur-[10px]
        shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
      "
    >
      <h2 className="mb-5 text-xl font-semibold text-white">
        Create Scholarship Program
      </h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className={inputBase}
            required
            placeholder="Title"
          />
        </div>

        <div className="md:col-span-2">
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={textareaBase}
            rows={3}
            placeholder="Details about eligibility..."
          />
        </div>

        <div>
        <label className="mb-1 block text-xs text-white/70">Category</label>
        <GlassSelect
            value={formData.category}
            onChange={(v) => setFormData({ ...formData, category: v })}
            options={[
            { value: 'Academic', valueLabel: 'Academic', label: 'Academic' },
            { value: 'Sports', label: 'Sports' },
            { value: 'Arts', label: 'Arts' },
            { value: 'Leadership', label: 'Leadership' },
            { value: 'Special Talent', label: 'Special Talent' },
            ]}
            placeholder="Select category"
        />
        </div>

        <div>
        <label className="mb-1 block text-xs text-white/70">Funding Type</label>
        <GlassSelect
            value={formData.fundingType}
            onChange={(v) => setFormData({ ...formData, fundingType: v })}
            options={[
            { value: 'Fully Funded', label: 'Fully Funded' },
            { value: 'Partially Funded', label: 'Partially Funded' },
            ]}
            placeholder="Select funding type"
        />
        </div>


        <div>
          <label className="mb-1 block text-xs text-white/70">
            Quota (Slots)
          </label>
          <input
            type="number"
            value={formData.quota}
            onChange={(e) =>
              setFormData({ ...formData, quota: e.target.value })
            }
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/70">
            Min Score (0-100)
          </label>
          <input
            type="number"
            value={formData.minScore}
            onChange={(e) =>
              setFormData({ ...formData, minScore: e.target.value })
            }
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/70">
            Open Date
          </label>
          <DatePicker
            selected={formData.openDate}
            onChange={(d) => setFormData({ ...formData, openDate: d })}
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/70">
            Close Date
          </label>
          <DatePicker
            selected={formData.closeDate}
            onChange={(d) => setFormData({ ...formData, closeDate: d })}
            className={inputBase}
          />
        </div>

        <div className="md:col-span-2 mt-1">
          <button
            type="submit"
            className="
              h-11 inline-flex items-center gap-2
                        rounded-full border border-white/30
                      bg-white/[0.35] px-4
                        text-sm text-white
                      hover:bg-white/[0.50]
            "
          >
            Publish Program
          </button>
        </div>
      </form>
    </div>
  );
};

const EditProgramModal = ({ program, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    ...program,
    openDate: new Date(program.openDate),
    closeDate: new Date(program.closeDate),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.closeDate <= formData.openDate)
      return alert('Close Date must be AFTER Open Date');
    if (formData.minScore < 0 || formData.minScore > 100)
      return alert('Score must be 0-100');

    try {
      await api.put(`/finance/programs/${program._id}`, formData);
      alert('Program Updated!');
      onRefresh();
      onClose();
    } catch (e) {
      alert('Failed: ' + e.response?.data?.message);
    }
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-sm text-white outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="
          w-full max-w-2xl max-h-[90vh] overflow-y-auto
          rounded-2xl border border-white/25
          bg-white/[0.06] p-6
          backdrop-blur-[14px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.22)]
        "
      >
        <h3 className="mb-5 text-xl font-semibold text-white">
          Edit Program
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={inputBase}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text.white/70">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="h-24 w-full rounded-2xl border border-white/25 bg-white/[0.05] p-3 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">
              Min Score
            </label>
            <input
              type="number"
              value={formData.minScore}
              onChange={e => setFormData({ ...formData, minScore: e.target.value })}
              className="
                h-11 w-full rounded-full px-4
                border border-white/25 bg-white/[0.05]
                text-white placeholder-white/60
                backdrop-blur-[10px]
                shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]
                focus:outline-none focus:ring-2 focus:ring-white/40
                transition-all
              "
            />

          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Quota</label>
            <input
              type="number"
              value={formData.quota}
              onChange={e => setFormData({ ...formData, quota: e.target.value })}
              className="
                h-11 w-full rounded-full px-4
                border border-white/25 bg-white/[0.05]
                text-white placeholder-white/60
                backdrop-blur-[10px]
                shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]
                focus:outline-none focus:ring-2 focus:ring-white/40
                transition-all
              "
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">
              Open Date
            </label>
            <DatePicker
              selected={formData.openDate}
              onChange={(d) => setFormData({ ...formData, openDate: d })}
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Close Date
            </label>
            <DatePicker
              selected={formData.closeDate}
              onChange={(d) => setFormData({ ...formData, closeDate: d })}
              className={inputBase}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 border-t border-white/15 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full px-4 text-sm text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                h-11 rounded-full bg-white/[0.2]
                px-5 text-sm font-semibold text-white
                shadow-[inset_0_0_18px_rgba(255,255,255,0.28)]
                hover:bg-white/[0.26]
              "
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- 3. APPLICATION FORM (Using proofDoc) ---
const ApplicationForm = ({ program, user, onBack }) => {
  const [formData, setFormData] = useState({
    dob: new Date(),
    averageScore: '',
    dataAccuracyConfirmed: false,
    parentConsent: false,
  });
  const [files, setFiles] = useState({
    identityDoc: null,
    proofDoc: null,
    achievementDoc: null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.averageScore < 0 || formData.averageScore > 100)
      return alert('Score must be 0-100');
    if (!formData.dataAccuracyConfirmed || !formData.parentConsent)
      return alert('Accept legal declarations.');

    setLoading(true);
    const fd = new FormData();
    fd.append('programId', program._id);
    fd.append('averageScore', formData.averageScore);
    fd.append('gradeLevel', user.gradeLevel || 10);
    fd.append('dob', formData.dob.toISOString());

    if (files.identityDoc) fd.append('identityDoc', files.identityDoc);
    if (files.proofDoc) fd.append('proofDoc', files.proofDoc);
    if (files.achievementDoc) fd.append('achievementDoc', files.achievementDoc);

    try {
      await api.post('/finance/apply', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Application Submitted!');
      onBack();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-sm text-white outline-none';

  return (
    <div
      className="
        mx-auto max-w-3xl
        rounded-[1.75rem] border border-white/25
        bg-white/[0.05] px-5 py-5
        backdrop-blur-[10px]
        shadow-[inset_0_0_22px_rgba(255,255,255,0.2)]
      "
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-3 text-xs text-white/70 hover:text-white"
      >
        ← Back
      </button>
      <h2 className="mb-5 text-xl font-semibold text-white">
        Apply: {program.title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Date of Birth
            </label>
            <DatePicker
              selected={formData.dob}
              onChange={(d) => setFormData({ ...formData, dob: d })}
              className={inputBase}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Average Score (0-100)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.averageScore}
              onChange={(e) =>
                setFormData({ ...formData, averageScore: e.target.value })
              }
              className={inputBase}
              required
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/18 bg-white/[0.03] p-4 shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]">
          <h3 className="mb-1 text-sm font-semibold text-white">
            Documents (Will be Zipped)
          </h3>
          <StyledFileInput
            label="Identity Doc"
            onChange={(f) => setFiles({ ...files, identityDoc: f })}
            file={files.identityDoc}
          />
          <StyledFileInput
            label="Proof of Qualification (Report Card/Portfolio)"
            onChange={(f) => setFiles({ ...files, proofDoc: f })}
            file={files.proofDoc}
          />
          {program.category !== 'Academic' && (
            <StyledFileInput
              label="Certificate"
              onChange={(f) =>
                setFiles({ ...files, achievementDoc: f })
              }
              file={files.achievementDoc}
            />
          )}
        </div>

        <div className="space-y-2 border-t border-white/12 pt-3">
          <label className=" flex gap-1.5 cursor-pointer items-center text-xs text-white/80">
            <input
              type="checkbox"
              checked={formData.dataAccuracyConfirmed}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dataAccuracyConfirmed: e.target.checked,
                })
              }
              className="peer relative h-4 w-4 shrink-0 appearance-none
                rounded border border-white/70 bg-white/10
                backdrop-blur-[4px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)]
                transition-all
                checked:bg-white/25 checked:border-white checked:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]
                focus:outline-none focus-visible:ring-0
                after:pointer-events-none after:absolute after:left-[5px] after:top-[2px]
                after:h-[7px] after:w-[4px] after:rotate-45
                after:border-b-[1.5px] after:border-r-[1.5px] after:border-white
                after:opacity-0 checked:after:opacity-100
                after:content-['']"
            />
            I declare that the data is accurate.
          </label>
          <label className="flex gap-1.5 cursor-pointer items-center text-xs text.white/80">
            <input
              type="checkbox"
              checked={formData.parentConsent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentConsent: e.target.checked,
                })
              }
              className="peer relative h-4 w-4 shrink-0 appearance-none
                rounded border border-white/70 bg-white/10
                backdrop-blur-[4px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)]
                transition-all
                checked:bg-white/25 checked:border-white checked:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]
                focus:outline-none focus-visible:ring-0
                after:pointer-events-none after:absolute after:left-[5px] after:top-[2px]
                after:h-[7px] after:w-[4px] after:rotate-45
                after:border-b-[1.5px] after:border-r-[1.5px] after:border-white
                after:opacity-0 checked:after:opacity-100
                after:content-['']"
            />
             Parental consent obtained.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            mt-2 h-11 w-full rounded-full
            bg-white/[0.22] text-sm font-semibold text-white
            shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]
            transition hover:bg-white/[0.28]
            disabled:opacity-60
          "
        >
          {loading ? 'Zipping & Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

const StyledFileInput = ({ label, onChange, file }) => (
  <div className="flex items-center justify-between rounded-2xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white/80">
    <span>{label}</span>
    <div className="flex items-center">
      {file && (
        <span className="mr-3 max-w-[130px] truncate text-[11px] text-white-200">
          {file.name}
        </span>
      )}
      <label
        className="
          flex h-9 cursor-pointer items-center
          rounded-full bg-white/[0.22] px-3
          text-[11px] font-semibold text-white
          shadow-[inset_0_0_14px_rgba(255,255,255,0.28)]
          hover:bg-white/[0.3]
        "
      >
        <PaperClipIcon className="mr-1 h-3 w-3" />
        {file ? 'Change' : 'Choose File'}
        <input
          type="file"
          onChange={(e) => onChange(e.target.files[0])}
          className="hidden"
        />
      </label>
    </div>
  </div>
);

// --- 4. REVIEW APPLICATIONS (Admin & Student View) ---
const ReviewApplications = ({ user }) => {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    const { data } = await api.get('/finance/applications');
    setApps(data);
  };

  const handleStatus = async (id, status) => {
    if (!window.confirm(`Mark this application as ${status}?`)) return;
    try {
      await api.put(`/finance/applications/${id}`, { status });
      fetchApps();
    } catch (e) {
      alert('Failed');
    }
  };

  return (
    <div className="space-y-4">
      {apps.length === 0 && (
        <button
          className="
            h-11 w-full rounded-full border border-white/25
            bg-white-500/80 text-sm text-white
            shadow-[inset_0_0_18px_rgba(255,255,255,0.28)]
            transition-all hover:bg-white-400/90 active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          No applications found.
        </button>
      )}
      {apps.map((app) => (
        <div
          key={app._id}
          className="
            relative flex flex-col gap-4
            rounded-2xl border border-white/22
            bg-white/[0.04] p-5
            backdrop-blur-[10px]
            shadow-[inset_0_0_18px_rgba(255,255,255,0.2)]
            transition
            hover:border-white/50
          md:flex-row md:items-center
          "
        >
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              app.status === 'Awarded' || app.status === 'Approved'
                ? 'bg-white-400'
                : app.status === 'Rejected'
                ? 'bg-white-400'
                : 'bg-white-300'
            }`}
          />

          <div className="flex-1 pl-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                {app.program?.title}
              </h3>
              <span
                className={`
                  rounded-full border px-3 py-1 text-xs font-bold
                  ${
                    app.status === 'Awarded' || app.status === 'Approved'
                      ? 'border-white-700 bg-white-900/60 text-white-300'
                      : app.status === 'Rejected'
                      ? 'border-white-700 bg-white-900/60 text-white-300'
                      : 'border-white-700 bg-white-900/60 text-white-300'
                  }
                `}
              >
                {app.status}
              </span>
            </div>

            <div className="mb-2 text-sm text-white/75">
              <span className="font-medium text-white">
                Applicant: {app.student?.name}
              </span>
              <span className="mx-2 text-white/60">•</span>
              Score:{' '}
              <span className="font-semibold text-white">
                {app.averageScore}
              </span>
            </div>

            <a
              href={app.fileUrl}
              className="mt-1 inline-flex items-center text-xs text-white-200 underline hover:text-white-100"
            >
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
              Download Application Zip
            </a>
          </div>

          {/* Admin actions */}
          {user.role === 'admin' &&
            (app.status === 'Submitted' ||
              app.status === 'Under Review') && (
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 pl-4 md:border-t-0 md:border-l md:pt-0 md:pl-4">
                <button
                  type="button"
                  onClick={() => handleStatus(app._id, 'Awarded')}
                  className="
                    inline-flex h-11 items-center rounded-full
                    bg-white-500 px-4 text-xs font-semibold text-white
                    shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
                    hover:bg-white/[0.16] hover:text-white
                    border border-white-500/80
                  "
                >
                  <CheckCircleIcon className="mr-1 h-4 w-4" />
                  Award
                </button>
                <button
                  type="button"
                  onClick={() => handleStatus(app._id, 'Rejected')}
                  className="
                    inline-flex h-11 items-center rounded-full
                    bg-white-500 px-4 text-xs font-semibold text-white
                    shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
                    hover:bg-white/[0.16] hover:text-white
                    border border-white-500/80
                  "
                >
                  <XCircleIcon className="mr-1 h-4 w-4" />
                  Reject
                </button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default Scholarship;
