import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PaperClipIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

/* ---------------------- GLASS SELECT ---------------------- */
const GlassSelect = ({
  value,
  onChange,
  options = [],
  placeholder = '',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected =
    options.find((o) => o.value === value) ||
    { label: placeholder || (options[0] && options[0].label) || '' };

  useEffect(() => {
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
          hover:bg-white/[0.08]
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
            pointer-events-auto
            absolute left-0 z-[60] mt-2 w-full
            overflow-hidden rounded-2xl
            border border-white/25 bg-black/75
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

/* ------------------- GLASS NUMBER INPUT ------------------- */
const GlassNumberInput = ({
  value,
  onChange,
  min,
  max,
  step,
  className = '',
  ...rest
}) => (
  <input
    type="number"
    value={value}
    onChange={onChange}
    min={min}
    max={max}
    step={step}
    className={`
      h-11 w-full rounded-full border border-white/22
      bg-white/[0.05] px-4 text-xs text-white
      outline-none backdrop-blur-[10px]
      shadow-[inset_0_0_10px_rgba(255,255,255,0.16)]
      focus:border-white/70 focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.85)]
      ${className}
    `}
    {...rest}
  />
);

/* ============================ MAIN ============================ */

const FeeRelief = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingApp, setEditingApp] = useState(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/finance/fee-relief');
      setApps(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = async (formData) => {
    try {
      await api.post('/finance/fee-relief', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Application Submitted!');
      fetchApps();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send');
    }
  };

  const handleStatus = async (id, status) => {
    if (!window.confirm(`Update status to ${status}?`)) return;
    try {
      await api.put(`/finance/fee-relief/${id}/status`, { status });
      setApps(apps.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch (e) {
      alert('Update failed');
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const { data: updated } = await api.put(`/finance/fee-relief/${id}`, data);
      setApps(apps.map((a) => (a._id === id ? updated : a)));
      setEditingApp(null);
      alert('Updated!');
    } catch (e) {
      alert('Update Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/finance/fee-relief/${id}`);
      setApps(apps.filter((a) => a._id !== id));
    } catch (e) {
      alert('Delete Failed');
    }
  };

  // --- FILTER LOGIC ---
  const filteredApps = apps.filter((app) => {
    const query = searchQuery.toLowerCase();
    const studentName = app.student?.name?.toLowerCase() || '';
    const type = app.reliefType?.toLowerCase() || '';
    const category = app.hardshipCategory?.toLowerCase() || '';

    return (
      studentName.includes(query) ||
      type.includes(query) ||
      category.includes(query)
    );
  });

  return (
    <div className="container mx-auto pb-10 px-3 sm:px-0">
      {user.role === 'student' && <ApplicationForm onSubmit={handleApply} />}

      {/* Search Bar – Admin */}
      {user.role === 'admin' && (
        <div className="relative mt-6 mb-8 max-w-4xl mx-auto">
          <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Search fee relief..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              h-11 w-full rounded-full border border-white/20
              bg-white/[0.06] pl-10 pr-4 text-sm text-white
              outline-none backdrop-blur-[12px]
              shadow-[inset_0_0_16px_rgba(255,255,255,0.22)]
              placeholder:text-white/50
              focus:border-white/60
            "
          />
        </div>
      )}

      <div className="mt-8 space-y-8 max-w-4xl mx-auto">
        <Section
          title="Fee Relief Requests"
          list={filteredApps}
          user={user}
          onStatus={handleStatus}
          onDelete={handleDelete}
          onEdit={setEditingApp}
        />
      </div>

      {editingApp && (
        <EditAppModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

/* ===================== APPLICATION FORM ===================== */

const ApplicationForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    reliefType: 'Partial Fee Reduction',
    hardshipCategory: 'Income Instability',
    employmentStatus: 'Employed',
    incomeRange: 'Low',
    dependents: 1,
    paymentCondition: 'Partially Paid',
    parentConsent: false,
    truthDeclaration: false,
  });

  const [files, setFiles] = useState({
    incomeDoc: null,
    terminationDoc: null,
    medicalDoc: null,
    assistanceDoc: null,
    disasterDoc: null,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.truthDeclaration)
      return alert('You must declare the truthfulness of data.');

    setLoading(true);
    const fd = new FormData();
    Object.keys(formData).forEach((key) => fd.append(key, formData[key]));
    Object.keys(files).forEach((key) => {
      if (files[key]) fd.append(key, files[key]);
    });

    await onSubmit(fd);
    setLoading(false);

    setFormData({
      reliefType: 'Partial Fee Reduction',
      hardshipCategory: 'Income Instability',
      employmentStatus: 'Employed',
      incomeRange: 'Low',
      dependents: 1,
      paymentCondition: 'Partially Paid',
      parentConsent: false,
      truthDeclaration: false,
    });
    setFiles({
      incomeDoc: null,
      terminationDoc: null,
      medicalDoc: null,
      assistanceDoc: null,
      disasterDoc: null,
    });
  };

  return (
    <div
      className="
        max-w-4xl mx-auto rounded-3xl border border-white/18
        bg-white/[0.04] p-6
        shadow-[inset_0_18px_45px_rgba(255,255,255,0.2)]
        backdrop-blur-[18px]
      "
    >
      <h2 className="mb-6 flex items-center text-xl font-bold text-white">
        <BanknotesIcon className="mr-2 h-6 w-6 text-white-300" />
        Student Fee Relief Application
      </h2>

      <form className="space-y-6 text-sm text-white" onSubmit={handleSubmit}>
        {/* Relief + Hardship */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Relief Type
            </label>
            <GlassSelect
              value={formData.reliefType}
              onChange={(v) => setFormData({ ...formData, reliefType: v })}
              options={[
                {
                  label: 'Partial Fee Reduction',
                  value: 'Partial Fee Reduction',
                },
                { label: 'Full Fee Waiver', value: 'Full Fee Waiver' },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">
              Financial Hardship Category
            </label>
            <GlassSelect
              value={formData.hardshipCategory}
              onChange={(v) =>
                setFormData({ ...formData, hardshipCategory: v })
              }
              options={[
                { label: 'Parent Lost Job', value: 'Parent Lost Job' },
                { label: 'Medical Emergency', value: 'Medical Emergency' },
                {
                  label: 'Natural Disaster Impact',
                  value: 'Natural Disaster Impact',
                },
                { label: 'Single Parent', value: 'Single Parent' },
                { label: 'Income Instability', value: 'Income Instability' },
              ]}
            />
          </div>
        </div>

        {/* Household card */}
        <div
          className="
           relative z-20 mb-6 overflow-visible
          rounded-2xl border border-white/18
          bg-white/[0.03] p-4
          backdrop-blur-[10px]
          shadow-[inset_0_0_14px_rgba(255,255,255,0.16)]
          "
        >
          <h3 className="mb-3 border-b border-white/15 pb-2 text-xs font-semibold tracking-wide text-white/80">
            Household Condition
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] text-white/65">
                Parent Employment
              </label>
              <GlassSelect
                value={formData.employmentStatus}
                onChange={(v) =>
                  setFormData({ ...formData, employmentStatus: v })
                }
                options={[
                  { label: 'Employed', value: 'Employed' },
                  { label: 'Unemployed', value: 'Unemployed' },
                  { label: 'Self-Employed', value: 'Self-Employed' },
                  { label: 'Retired', value: 'Retired' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/65">
                Monthly Income Range
              </label>
              <GlassSelect
                value={formData.incomeRange}
                onChange={(v) =>
                  setFormData({ ...formData, incomeRange: v })
                }
                options={[
                  { label: 'Very Low', value: 'Very Low' },
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'Above Medium', value: 'Above Medium' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/65">
                Dependents
              </label>
              <GlassNumberInput
                min={0}
                value={formData.dependents}
                onChange={(e) =>
                  setFormData({ ...formData, dependents: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-[11px] text-white/65">
              Tuition Payment Status
            </label>
            <GlassSelect
              value={formData.paymentCondition}
              onChange={(v) =>
                setFormData({ ...formData, paymentCondition: v })
              }
              options={[
                { label: 'Fully Unpaid', value: 'Fully Unpaid' },
                { label: 'Partially Paid', value: 'Partially Paid' },
                { label: 'Payment Delayed', value: 'Payment Delayed' },
              ]}
            />
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-3">
          <h3 className="border-b border-white/15 pb-2 text-xs font-semibold tracking-wide text-white/80">
            Verification Documents
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <StyledFileInput
              label="Proof of Income"
              onChange={(f) => setFiles({ ...files, incomeDoc: f })}
              file={files.incomeDoc}
            />
            <StyledFileInput
              label="Termination Letter (If applicable)"
              onChange={(f) => setFiles({ ...files, terminationDoc: f })}
              file={files.terminationDoc}
            />
            <StyledFileInput
              label="Medical Bill (If applicable)"
              onChange={(f) => setFiles({ ...files, medicalDoc: f })}
              file={files.medicalDoc}
            />
            <StyledFileInput
              label="Govt. Assistance Card"
              onChange={(f) => setFiles({ ...files, assistanceDoc: f })}
              file={files.assistanceDoc}
            />
            <StyledFileInput
              label="Disaster Certificate (If applicable)"
              onChange={(f) => setFiles({ ...files, disasterDoc: f })}
              file={files.disasterDoc}
            />
          </div>
        </div>

        {/* Declaration */}
        <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
          <label className="flex cursor-pointer items-center gap-1.5 text-white/80 hover:text-white">
            <input
              type="checkbox"
              checked={formData.parentConsent}
              onChange={(e) =>
                setFormData({ ...formData, parentConsent: e.target.checked })
              }
              className="peer relative h-4 w-4 shrink-0 appearance-none rounded border border-white/70 bg-white/10
                backdrop-blur-[4px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)]
                transition-all checked:border-white checked:bg-white/25
                checked:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]
                focus:outline-none focus-visible:ring-0
                after:pointer-events-none after:absolute after:left-[5px] after:top-[2px]
                after:h-[7px] after:w-[4px] after:rotate-45
                after:border-b-[1.5px] after:border-r-[1.5px] after:border-white
                after:opacity-0 checked:after:opacity-100 after:content-['']"
            />
            Parental / Guardian consent obtained.
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-white/80 hover:text-white">
            <input
              type="checkbox"
              checked={formData.truthDeclaration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  truthDeclaration: e.target.checked,
                })
              }
              className="peer relative h-4 w-4 shrink-0 appearance-none rounded border border-white/70 bg-white/10
                backdrop-blur-[4px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)]
                transition-all checked:border-white checked:bg-white/25
                checked:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]
                focus:outline-none focus-visible:ring-0
                after:pointer-events-none after:absolute after:left-[5px] after:top-[2px]
                after:h-[7px] after:w-[4px] after:rotate-45
                after:border-b-[1.5px] after:border-r-[1.5px] after:border-white
                after:opacity-0 checked:after:opacity-100 after:content-['']"
            />
            I declare that the information provided is true and accurate.
          </label>
        </div>

        <button
          disabled={loading}
          className="
            h-11 w-full rounded-full border border-white/25
            bg-white-500/80 text-sm font-semibold text-white
            shadow-[inset_0_0_18px_rgba(255,255,255,0.28)]
            transition-all hover:bg-white-400/90 active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-60 hover:bg-white/25
          "
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

/* ====================== SUB COMPONENTS ====================== */

const StyledFileInput = ({ label, onChange, file }) => (
  <div
    className="
      flex items-center justify-between rounded-2xl border border-white/18
      bg-white/[0.05] px-3 py-2
      backdrop-blur-[12px]
      shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]
    "
  >
    <span className="text-[11px] font-medium text-white/80">{label}</span>
    <div className="flex items-center">
      {file && (
        <span className="mr-2 max-w-[100px] truncate text-[10px] text-white-300">
          {file.name}
        </span>
      )}
      <label
        className="
          flex h-8 cursor-pointer items-center rounded-full
          border border-white/40 bg-white/15 px-3 text-[11px]
          font-semibold text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.35)]
          transition-all hover:bg-white/25
        "
      >
        <PaperClipIcon className="mr-1 h-3 w-3" />
        {file ? 'Change' : 'Upload'}
        <input
          type="file"
          onChange={(e) => onChange(e.target.files[0])}
          className="hidden"
        />
      </label>
    </div>
  </div>
);

const Section = ({ title, list, user, onStatus, onDelete, onEdit, isHistory }) => (
  <div
    className={`
      rounded-3xl border border-white/16
      bg-white/[0.03] backdrop-blur-[16px]
      shadow-[inset_0_18px_45px_rgba(255,255,255,0.2)]
      ${isHistory ? 'opacity-80' : ''}
    `}
  >
    <h2 className="border-b border-white/12 p-6 text-xl font-bold text-white">
      {title}
    </h2>
    <div className="divide-y divide-white/8">
      {list.length === 0 && (
        <p className="p-6 text-sm text-white/55">No requests found.</p>
      )}
      {list.map((app) => (
        <div
          key={app._id}
          className="flex flex-col justify-between gap-4 p-6 text-sm text-white md:flex-row hover:bg-white/5"
        >
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold border border-white/30 ${getStatusColor(
                  app.status
                )}`}
              >
                {app.status}
              </span>
              <span className="text-xs text-white/60">
                {new Date(app.createdAt).toLocaleDateString()}
              </span>
              <span className="rounded-full border border-white-200/40 bg-white-400/15 px-2 py-0.5 text-[10px] text-white-100">
                {app.reliefType}
              </span>
              {user.role === 'admin' && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    getPriority(app) > 6
                      ? 'border-white-400/70 bg-white-500/15 text-white-200'
                      : 'border-white/25 bg-white/10 text-white/70'
                  }`}
                >
                  Priority: {getPriority(app)}
                </span>
              )}
            </div>

            <p className="text-lg font-semibold text-white">
              {app.student?.name}
            </p>

            <div
              className="
                mt-3 mb-4 grid grid-cols-2 gap-x-6 gap-y-1 rounded-2xl
                border border-white/12 bg-white/20 p-3 text-xs text-white/70
              "
            >
              <span>
                Category:{' '}
                <span className="font-medium text-white">
                  {app.hardshipCategory}
                </span>
              </span>
              <span>
                Income:{' '}
                <span className="font-medium text-white">{app.incomeRange}</span>
              </span>
              <span>
                Dependents:{' '}
                <span className="font-medium text-white">
                  {app.dependents}
                </span>
              </span>
              <span>
                Payment:{' '}
                <span className="font-medium text-white">
                  {app.paymentCondition}
                </span>
              </span>
            </div>

            <a
              href={app.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs font-semibold text-white-300 hover:text-white-200"
            >
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
              Download Evidence Zip
            </a>
          </div>

          {/* Admin Actions */}
          {user.role === 'admin' && !isHistory && (
            <div className="flex w-full flex-col items-stretch gap-2 md:w-[180px]">
              {app.status === 'Submitted' && (
                <button
                  onClick={() => onStatus(app._id, 'Financial Verification')}
                  className="h-10 inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-4 text-xs sm:text-sm text-white hover:bg-white/[0.18]"
                >
                  Verify Docs
                </button>
              )}

              {app.status === 'Financial Verification' && (
                <>
                  <button
                    onClick={() => onStatus(app._id, 'Approved')}
                    className="h-10 inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-4 text-xs sm:text-sm text-white hover:bg-white/[0.18]"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => onStatus(app._id, 'Rejected')}
                    className="h-10 inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-4 text-xs sm:text-sm text-white hover:bg-white/[0.18]"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </button>
                </>
              )}

              {app.status === 'Approved' && (
                <button
                  onClick={() => onStatus(app._id, 'Fee Adjustment Applied')}
                  className="h-10 inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-4 text-xs sm:text-sm text-white hover:bg-white/[0.18]"
                >
                  Apply Adjustment
                </button>
              )}

              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  onClick={() => onEdit(app)}
                  className="h-10 inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-4 text-xs sm:text-sm text-white hover:bg-white/[0.18]"
                >
                  <PencilSquareIcon className="mr-1 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(app._id)}
                  className="h-10 inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/[0.12] px-4 text-xs sm:text-sm text-white hover:bg-white/[0.18]"
                >
                  <TrashIcon className="mr-1 h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const EditAppModal = ({ app, onClose, onUpdate }) => {
  const [data, setData] = useState({
    reliefType: app.reliefType,
    hardshipCategory: app.hardshipCategory,
    incomeRange: app.incomeRange,
    paymentCondition: app.paymentCondition,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(app._id, data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/18 bg-white/[0.04] p-6 text-sm text-white shadow-[0_18px_60px_rgba(0,0,0,0.8)] backdrop-blur-[18px]">
        <h3 className="mb-4 text-xl font-bold">Edit Application</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Relief Type
            </label>
            <GlassSelect
              value={data.reliefType}
              onChange={(v) => setData({ ...data, reliefType: v })}
              options={[
                {
                  label: 'Partial Fee Reduction',
                  value: 'Partial Fee Reduction',
                },
                { label: 'Full Fee Waiver', value: 'Full Fee Waiver' },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">
              Hardship Category
            </label>
            <GlassSelect
              value={data.hardshipCategory}
              onChange={(v) => setData({ ...data, hardshipCategory: v })}
              options={[
                { label: 'Parent Lost Job', value: 'Parent Lost Job' },
                { label: 'Medical Emergency', value: 'Medical Emergency' },
                {
                  label: 'Natural Disaster Impact',
                  value: 'Natural Disaster Impact',
                },
                { label: 'Single Parent', value: 'Single Parent' },
                { label: 'Income Instability', value: 'Income Instability' },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">
              Income Range
            </label>
            <GlassSelect
              value={data.incomeRange}
              onChange={(v) => setData({ ...data, incomeRange: v })}
              options={[
                { label: 'Very Low', value: 'Very Low' },
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Above Medium', value: 'Above Medium' },
              ]}
            />
          </div>

          <div className="relative z-40">
            <label className="mb-1 block text-xs text-white/70">
              Tuition Payment Status
            </label>
            <GlassSelect
              value={data.paymentCondition}
              onChange={(v) =>
                setData({ ...data, paymentCondition: v })
              }
              options={[
                { label: 'Fully Unpaid', value: 'Fully Unpaid' },
                { label: 'Partially Paid', value: 'Partially Paid' },
                { label: 'Payment Delayed', value: 'Payment Delayed' },
              ]}
            />
          </div>

          <div className="mt-3 flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full px-4 text-xs font-semibold text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              className="h-9 rounded-full bg-white-600 px-4 text-xs font-semibold text-white shadow hover:bg-white-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ======================== HELPERS ======================== */

const getStatusColor = (s) => {
  if (s === 'Approved') return 'bg-white-900 text-white-200';
  if (s === 'Fee Adjustment Applied')
    return 'bg-white-900 text-white-200';
  if (s === 'Rejected') return 'bg-white-900 text-white-200';
  if (s === 'Financial Verification')
    return 'bg-white-900 text-white-200';
  return 'bg-white/10 text-white/75';
};

const getPriority = (app) => {
  let score = 0;
  if (app.incomeRange === 'Very Low') score += 3;
  if (app.incomeRange === 'Low') score += 2;
  if (app.paymentCondition === 'Fully Unpaid') score += 3;
  if (app.paymentCondition === 'Payment Delayed') score += 2;
  if (
    app.hardshipCategory === 'Natural Disaster Impact' ||
    app.hardshipCategory === 'Medical Emergency'
  )
    score += 2;
  score += Math.min(app.dependents, 3);
  return score;
};

export default FeeRelief;
