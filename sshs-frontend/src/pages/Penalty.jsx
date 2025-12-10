import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ExclamationTriangleIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

// ---------- Shared Glass Select (same behaviour as in Scholarship) ----------
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

// --- CONFIGURATION: VIOLATION DEFAULTS ---
const VIOLATION_DEFAULTS = {
  'Attendance Violation': { severity: 'Minor', punishment: 'Verbal Warning' },
  'Uniform Violation': { severity: 'Minor', punishment: 'Verbal Warning' },
  'Classroom Misconduct': { severity: 'Moderate', punishment: 'Detention' },
  'Cheating / Academic Dishonesty': { severity: 'Major', punishment: 'Suspension' },
  'Bullying / Harassment': { severity: 'Major', punishment: 'Suspension' },
  'IT / Lab Misuse': { severity: 'Moderate', punishment: 'Temporary Activity Ban' },
  'Property Damage': { severity: 'Major', punishment: 'Parent Call / Meeting' },
  'Dormitory Violation': { severity: 'Moderate', punishment: 'Written Warning' },
};

const Penalty = () => {
  const { user } = useAuth();
  const [penalties, setPenalties] = useState([]);
  const [editingPenalty, setEditingPenalty] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPenalties();
  }, []);

  const fetchPenalties = async () => {
    try {
      const { data } = await api.get('/behavior/penalty');
      setPenalties(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async (formData) => {
    try {
      await api.post('/behavior/penalty', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Penalty Case Recorded!');
      fetchPenalties();
    } catch (e) {
      alert('Failed: ' + e.response?.data?.message);
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await api.put(`/behavior/penalty/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Penalty Updated!');
      fetchPenalties();
      setEditingPenalty(null);
    } catch (e) {
      alert('Update Failed: ' + e.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this penalty record?')) return;
    try {
      await api.delete(`/behavior/penalty/${id}`);
      setPenalties(penalties.filter((p) => p._id !== id));
    } catch (e) {
      alert('Delete Failed');
    }
  };

  const filteredPenalties = penalties.filter((p) => {
    const query = searchQuery.toLowerCase();
    const studentName = p.student?.name?.toLowerCase() || '';
    const violation = p.violationCategory?.toLowerCase() || '';
    const status = p.status?.toLowerCase() || '';
    return (
      studentName.includes(query) ||
      violation.includes(query) ||
      status.includes(query)
    );
  });

  return (
    <div className="mx-auto max-w-4xl pb-10">
      {(user.role === 'admin' || user.role === 'teacher') && (
        <AssignPenaltyForm onAssign={handleAssign} />
      )}

      {/* Search bar glass */}
      <div className="relative mt-8 mb-6">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/60" />
        <input
          type="text"
          placeholder="Search penalties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            h-11 w-full rounded-full border border-white/25
            bg-white/[0.05] pl-10 pr-4 text-xs text-white
            placeholder-white/55 outline-none
            backdrop-blur-[10px]
            shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
            focus:ring-2 focus:ring-white/40
          "
        />
      </div>

      <div className="grid gap-5">
        {filteredPenalties.length === 0 && (
          <p className="text-sm text-white/60">
            No matching penalty records found.
          </p>
        )}
        {filteredPenalties.map((p) => (
          <PenaltyCard
            key={p._id}
            p={p}
            user={user}
            onEdit={() => setEditingPenalty(p)}
            onDelete={() => handleDelete(p._id)}
          />
        ))}
      </div>

      {editingPenalty && (
        <EditPenaltyModal
          penalty={editingPenalty}
          onClose={() => setEditingPenalty(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

const PenaltyCard = ({ p, user, onEdit, onDelete }) => {
  const isMajor = p.severityLevel === 'Major';
  const canManage =
    user.role === 'admin' ||
    (user.role === 'teacher' && p.issuedBy?._id === user._id);

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-[1.75rem] border
        ${isMajor ? 'border-white/70' : 'border-white/30'}
        bg-white/[0.04] p-5
        backdrop-blur-[10px]
        shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
      `}
    >
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left column */}
        <div className="flex min-w-[90px] flex-col items-center justify-center border-b border-white/10 pb-4 text-center md:border-b-0 md:border-r md:pb-0 md:pr-5">
          <div
            className="
              mb-2 flex h-14 w-14 items-center justify-center
              rounded-full border border-white/40 bg-white/[0.12]
              shadow-[inset_0_0_14px_rgba(255,255,255,0.3)]
            "
          >
            <ExclamationTriangleIcon className="h-7 w-7 text-white" />
          </div>
          <span className="text-[11px] font-mono text-white/70">
            {new Date(p.incidentDate).toLocaleDateString()}
          </span>
          <span
            className="
              mt-2 rounded-full border border-white/35
              bg-white/[0.1] px-2 py-0.5
              text-[10px] uppercase tracking-wide text-white
            "
          >
            {p.status}
          </span>
        </div>

        {/* Main content */}
        <div className="relative flex-1">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">
              {p.violationCategory}{' '}
              <span className="text-sm font-normal text-white/60">
                ({p.severityLevel})
              </span>
            </h3>

            {canManage && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="
                    flex h-9 w-9 items-center justify-center
                    rounded-full border border-white/30
                    bg-white/[0.12] text-white/80
                    shadow-[inset_0_0_14px_rgba(255,255,255,0.26)]
                    hover:bg-white/[0.22] hover:text-white
                    transition
                  "
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="
                    flex h-9 w-9 items-center justify-center
                    rounded-full border border-white/30
                    bg-white/[0.12] text-white/80
                    shadow-[inset_0_0_14px_rgba(255,255,255,0.26)]
                    hover:bg-white/[0.22] hover:text-white
                    transition
                  "
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <p className="mb-4 text-sm text-white/75">
            <span className="text-white/65">Student: </span>
            <span className="font-semibold text-white">{p.student?.name}</span>
          </p>

          <div
            className="
              grid grid-cols-2 gap-4
              rounded-2xl border border-white/18
              bg-white/[0.03] p-3 text-xs text-white/75
              shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]
            "
          >
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Punishment
              </span>
              <span className="text-sm text-white">{p.assignedPunishment}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Execution Status
              </span>
              <span className="text-sm text-white">{p.executionStatus}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Authority
              </span>
              <span className="text-sm text-white/90">
                {p.issuingAuthorityType}
              </span>
            </div>
            {p.overrideAuthority !== 'No Override' && (
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                  Override ({p.overrideAuthority})
                </span>
                <span className="text-sm text-white/85">
                  {p.overrideReason}
                </span>
              </div>
            )}
          </div>

          {p.evidenceUrl && (
            <div className="mt-3">
              <a
                href={p.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs text-white/80 underline hover:text-white"
              >
                <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
                View Evidence
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Student Search with Glass styling ----------
const StudentSearch = ({ students, selectedId, onSelect }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedId) {
      const s = students.find((stu) => stu._id === selectedId);
      if (s) setQuery(s.name);
    } else {
      setQuery('');
    }
  }, [selectedId, students]);

  const filteredStudents = students.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-[11px] text-white/70">
        Student Search
      </label>
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-white/60" />
        <input
          type="text"
          placeholder="Type name to search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') onSelect('');
          }}
          onFocus={() => setIsOpen(true)}
          className="
            h-11 w-full rounded-full border border-white/25
            bg-white/[0.06] pl-9 pr-8 text-xs text-white
            placeholder-white/55 outline-none
            backdrop-blur-[8px]
            shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]
          "
        />
        {selectedId && (
          <button
            type="button"
            onClick={() => {
              onSelect('');
              setQuery('');
            }}
            className="absolute right-3 top-2.5 text-white/60 hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredStudents.length > 0 && (
        <ul
          className="
            absolute z-40 mt-2 w-full max-h-60 overflow-y-auto
            rounded-2xl border border-white/25 bg-black/[0.85]
            backdrop-blur-[14px]
            shadow-[inset_0_0_18px_rgba(255,255,255,0.22)]
          "
        >
          {filteredStudents.map((s) => (
            <li key={s._id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(s._id);
                  setQuery(s.name);
                  setIsOpen(false);
                }}
                className="
                  w-full px-3 py-2 text-left text-xs text-white
                  transition hover:bg-white/10
                "
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-[11px] text-white/70">{s.email}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AssignPenaltyForm = ({ onAssign }) => {
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [incidentDate, setIncidentDate] = useState(new Date());

  const [violationCategory, setViolationCategory] = useState('');
  const [severityLevel, setSeverityLevel] = useState('Minor');
  const [issuingAuthorityType, setIssuingAuthorityType] =
    useState('Subject Teacher');
  const [assignedPunishment, setAssignedPunishment] =
    useState('Verbal Warning');
  const [executionStatus, setExecutionStatus] = useState('Pending');

  const [overrideAuthority, setOverrideAuthority] = useState('No Override');
  const [overrideReason, setOverrideReason] =
    useState('Teacher Judgment');
  const [status, setStatus] = useState('Active');
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.get('/auth/users/student').then((res) => setStudents(res.data));
  }, []);

  const handleViolationChange = (category) => {
    setViolationCategory(category);
    if (VIOLATION_DEFAULTS[category]) {
      setSeverityLevel(VIOLATION_DEFAULTS[category].severity);
      setAssignedPunishment(VIOLATION_DEFAULTS[category].punishment);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId || !violationCategory)
      return alert('Select a student and violation category');

    const fd = new FormData();
    fd.append('studentId', studentId);
    fd.append('violationCategory', violationCategory);
    fd.append('severityLevel', severityLevel);
    fd.append('incidentDate', incidentDate.toISOString());
    fd.append('issuingAuthorityType', issuingAuthorityType);
    fd.append('assignedPunishment', assignedPunishment);
    fd.append('executionStatus', executionStatus);
    fd.append('overrideAuthority', overrideAuthority);
    if (overrideAuthority !== 'No Override') {
      fd.append('overrideReason', overrideReason);
    }
    fd.append('status', status);
    if (file) fd.append('evidence', file);

    onAssign(fd);
    setStudentId('');
    setFile(null);
    setViolationCategory('');
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-xs text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]';

  return (
    <form
      onSubmit={handleSubmit}
      className="
        rounded-[1.75rem] border border-white/25
        bg-white/[0.05] px-5 py-5
        backdrop-blur-[12px]
        shadow-[inset_0_0_22px_rgba(255,255,255,0.2)]
      "
    >
      <h2 className="mb-4 text-xl font-semibold text-white">
        New Disciplinary Case
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <StudentSearch
          students={students}
          selectedId={studentId}
          onSelect={setStudentId}
        />

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Date of Incident
          </label>
          <DatePicker
            selected={incidentDate}
            onChange={setIncidentDate}
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Issuing Authority
          </label>
          <GlassSelect
            value={issuingAuthorityType}
            onChange={setIssuingAuthorityType}
            options={[
              { value: 'Subject Teacher', label: 'Subject Teacher' },
              { value: 'Homeroom Teacher', label: 'Homeroom Teacher' },
              { value: 'Discipline Officer', label: 'Discipline Officer' },
              { value: 'Vice Principal', label: 'Vice Principal' },
              { value: 'Admin Staff', label: 'Admin Staff' },
            ]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Violation Category
          </label>
          <GlassSelect
            value={violationCategory}
            onChange={handleViolationChange}
            options={[
              { value: '', label: 'Select Violation' },
              ...Object.keys(VIOLATION_DEFAULTS).map((v) => ({
                value: v,
                label: v,
              })),
            ]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Severity Level
          </label>
          <GlassSelect
            value={severityLevel}
            onChange={setSeverityLevel}
            options={[
              { value: 'Minor', label: 'Minor' },
              { value: 'Moderate', label: 'Moderate' },
              { value: 'Major', label: 'Major' },
            ]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Assigned Punishment
          </label>
          <GlassSelect
            value={assignedPunishment}
            onChange={setAssignedPunishment}
            options={[
              { value: 'Verbal Warning', label: 'Verbal Warning' },
              { value: 'Written Warning', label: 'Written Warning' },
              { value: 'Detention', label: 'Detention' },
              { value: 'Community Service', label: 'Community Service' },
              { value: 'Parent Call / Meeting', label: 'Parent Call / Meeting' },
              { value: 'Temporary Activity Ban', label: 'Temporary Activity Ban' },
              { value: 'Suspension', label: 'Suspension' },
            ]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Execution Status
          </label>
          <GlassSelect
            value={executionStatus}
            onChange={setExecutionStatus}
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Case Status
          </label>
          <GlassSelect
            value={status}
            onChange={setStatus}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Active', label: 'Active' },
              { value: 'Under Review', label: 'Under Review' },
              { value: 'Resolved', label: 'Resolved' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-white/70">
            Supporting Evidence
          </label>
          <div className="flex items-center gap-2">
            <label
              className="
                flex h-11 cursor-pointer items-center
                rounded-full border border-white/30
                bg-white/[0.18] px-4 text-[11px] font-semibold text-white
                shadow-[inset_0_0_16px_rgba(255,255,255,0.3)]
                hover:bg-white/[0.26]
              "
            >
              <PaperClipIcon className="mr-1 h-4 w-4" />
              {file ? 'Change' : 'Upload'}
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            <span className="max-w-[140px] truncate text-xs italic text-white/65">
              {file ? file.name : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Override Section */}
      <div className="mt-5 rounded-2xl border border-white/18 bg-white/[0.03] p-4 shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/80">
          Override Controls
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-white/70">
              Override Authority
            </label>
            <GlassSelect
              value={overrideAuthority}
              onChange={setOverrideAuthority}
              options={[
                { value: 'No Override', label: 'No Override' },
                { value: 'Teacher Override', label: 'Teacher Override' },
                { value: 'Admin Override', label: 'Admin Override' },
              ]}
            />
          </div>
          {overrideAuthority !== 'No Override' && (
            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Override Reason
              </label>
              <GlassSelect
                value={overrideReason}
                onChange={setOverrideReason}
                options={[
                  { value: 'Teacher Judgment', label: 'Teacher Judgment' },
                  {
                    value: 'Administrative Decision',
                    label: 'Administrative Decision',
                  },
                  { value: 'Evidence Review', label: 'Evidence Review' },
                  { value: 'Student Appeal', label: 'Student Appeal' },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t border-white/12 pt-4">
        <button
          type="submit"
          className="
            h-11 rounded-full border border-white/35
            bg-white/[0.26] px-6 text-sm font-semibold text-white
            shadow-[inset_0_0_18px_rgba(255,255,255,0.32)]
            hover:bg-white/[0.34]
          "
        >
          Record Penalty
        </button>
      </div>
    </form>
  );
};

// --- EDIT MODAL ---
const EditPenaltyModal = ({ penalty, onClose, onUpdate }) => {
  const [studentId, setStudentId] = useState(penalty.student._id);
  const [students, setStudents] = useState([]);
  const [incidentDate, setIncidentDate] = useState(
    new Date(penalty.incidentDate),
  );
  const [violationCategory, setViolationCategory] = useState(
    penalty.violationCategory,
  );
  const [severityLevel, setSeverityLevel] = useState(penalty.severityLevel);
  const [issuingAuthorityType, setIssuingAuthorityType] = useState(
    penalty.issuingAuthorityType,
  );
  const [assignedPunishment, setAssignedPunishment] = useState(
    penalty.assignedPunishment,
  );
  const [executionStatus, setExecutionStatus] = useState(
    penalty.executionStatus,
  );
  const [overrideAuthority, setOverrideAuthority] = useState(
    penalty.overrideAuthority,
  );
  const [overrideReason, setOverrideReason] = useState(
    penalty.overrideReason || 'Teacher Judgment',
  );
  const [status, setStatus] = useState(penalty.status);
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.get('/auth/users/student').then((res) => setStudents(res.data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('studentId', studentId);
    fd.append('violationCategory', violationCategory);
    fd.append('severityLevel', severityLevel);
    fd.append('incidentDate', incidentDate.toISOString());
    fd.append('issuingAuthorityType', issuingAuthorityType);
    fd.append('assignedPunishment', assignedPunishment);
    fd.append('executionStatus', executionStatus);
    fd.append('overrideAuthority', overrideAuthority);
    if (overrideAuthority !== 'No Override') {
      fd.append('overrideReason', overrideReason);
    }
    fd.append('status', status);
    if (file) fd.append('evidence', file);

    onUpdate(penalty._id, fd);
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-xs text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="
          max-h-[90vh] w-full max-w-4xl overflow-y-auto
          rounded-2xl border border-white/25
          bg-white/[0.06] p-6
          backdrop-blur-[14px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.24)]
        "
      >
        <div className="mb-5 flex items-center justify-between border-b border-white/15 pb-3">
          <h3 className="text-xl font-semibold text-white">Edit Penalty</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <StudentSearch
              students={students}
              selectedId={studentId}
              onSelect={setStudentId}
            />

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Date
              </label>
              <DatePicker
                selected={incidentDate}
                onChange={setIncidentDate}
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Authority
              </label>
              <GlassSelect
                value={issuingAuthorityType}
                onChange={setIssuingAuthorityType}
                options={[
                  { value: 'Subject Teacher', label: 'Subject Teacher' },
                  { value: 'Homeroom Teacher', label: 'Homeroom Teacher' },
                  { value: 'Discipline Officer', label: 'Discipline Officer' },
                  { value: 'Vice Principal', label: 'Vice Principal' },
                  { value: 'Admin Staff', label: 'Admin Staff' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Violation
              </label>
              <GlassSelect
                value={violationCategory}
                onChange={setViolationCategory}
                options={[
                  ...Object.keys(VIOLATION_DEFAULTS).map((v) => ({
                    value: v,
                    label: v,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Severity
              </label>
              <GlassSelect
                value={severityLevel}
                onChange={setSeverityLevel}
                options={[
                  { value: 'Minor', label: 'Minor' },
                  { value: 'Moderate', label: 'Moderate' },
                  { value: 'Major', label: 'Major' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Punishment
              </label>
              <GlassSelect
                value={assignedPunishment}
                onChange={setAssignedPunishment}
                options={[
                  { value: 'Verbal Warning', label: 'Verbal Warning' },
                  { value: 'Written Warning', label: 'Written Warning' },
                  { value: 'Detention', label: 'Detention' },
                  { value: 'Community Service', label: 'Community Service' },
                  { value: 'Parent Call / Meeting', label: 'Parent Call / Meeting' },
                  { value: 'Temporary Activity Ban', label: 'Temporary Activity Ban' },
                  { value: 'Suspension', label: 'Suspension' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Execution Status
              </label>
              <GlassSelect
                value={executionStatus}
                onChange={setExecutionStatus}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Case State
              </label>
              <GlassSelect
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Under Review', label: 'Under Review' },
                  { value: 'Resolved', label: 'Resolved' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/70">
                Evidence
              </label>
              <div className="flex items-center gap-2">
                <label
                  className="
                    flex h-11 cursor-pointer items-center
                    rounded-full border border-white/30
                    bg-white/[0.18] px-4 text-[11px] font-semibold text-white
                    shadow-[inset_0_0_16px_rgba(255,255,255,0.3)]
                    hover:bg-white/[0.26]
                  "
                >
                  <PaperClipIcon className="mr-1 h-4 w-4" />
                  {file ? 'Change' : 'Replace'}
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <span className="max-w-[140px] truncate text-xs italic text-white/65">
                  {file ? file.name : 'Keep existing'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/18 bg-white/[0.03] p-4 shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/80">
              Override
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-white/70">
                  Authority
                </label>
                <GlassSelect
                  value={overrideAuthority}
                  onChange={setOverrideAuthority}
                  options={[
                    { value: 'No Override', label: 'No Override' },
                    { value: 'Teacher Override', label: 'Teacher Override' },
                    { value: 'Admin Override', label: 'Admin Override' },
                  ]}
                />
              </div>
              {overrideAuthority !== 'No Override' && (
                <div>
                  <label className="mb-1 block text-[11px] text-white/70">
                    Reason
                  </label>
                  <GlassSelect
                    value={overrideReason}
                    onChange={setOverrideReason}
                    options={[
                      {
                        value: 'Teacher Judgment',
                        label: 'Teacher Judgment',
                      },
                      {
                        value: 'Administrative Decision',
                        label: 'Administrative Decision',
                      },
                      { value: 'Evidence Review', label: 'Evidence Review' },
                      { value: 'Student Appeal', label: 'Student Appeal' },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-white/12 pt-4">
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
                h-11 rounded-full border border-white/30
                bg-white/[0.26] px-6 text-sm font-semibold text-white
                shadow-[inset_0_0_18px_rgba(255,255,255,0.32)]
                hover:bg-white/[0.34]
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

export default Penalty;
