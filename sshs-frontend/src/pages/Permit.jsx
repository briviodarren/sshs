import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperClipIcon,
  ClockIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

  

const GlassSelect = ({ value, onChange, options, className }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          w-full h-11 rounded-full border border-white/25
          bg-white/[0.08] px-4 pr-10 text-sm text-white
          backdrop-blur-[10px]
          shadow-[inset_0_0_14px_rgba(255,255,255,0.18)]
          flex items-center justify-between
        "
      >
        <span className="truncate">{selected?.label}</span>
        <svg
          className={`absolute right-4 h-4 w-4 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="white"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="
          absolute z-30 mt-2 w-full rounded-2xl border border-white/25
          bg-black/[0.75] backdrop-blur-[12px]
          shadow-[0_10px_30px_rgba(0,0,0,0.25)]
          overflow-hidden
        ">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="
                w-full text-left px-4 py-2 text-sm text-white
                hover:bg-black/[0.50] transition
              "
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


const Permit = () => {
  const { user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPermits();
  }, []);

  const fetchPermits = async () => {
    try {
      const { data } = await api.get('/permits');
      setPermits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      await api.post('/permits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Permit Request Sent!');
      fetchPermits();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send request');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/permits/${id}`, { status });
      // Optimistic update
      setPermits(permits.map((p) => (p._id === id ? { ...p, status } : p)));
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this permit record?')) return;
    try {
      await api.delete(`/permits/${id}`);
      setPermits(permits.filter((p) => p._id !== id));
    } catch (e) {
      alert('Failed to delete');
    }
  };

  // --- FILTER LOGIC ---

  const filteredPermits = permits.filter((p) => {
    const query = searchQuery.toLowerCase();
    const studentName = p.student?.name?.toLowerCase() || '';
    const className = p.class?.name?.toLowerCase() || '';
    const reason = p.reason?.toLowerCase() || '';
    const status = p.status?.toLowerCase() || '';

    return (
      studentName.includes(query) ||
      className.includes(query) ||
      reason.includes(query) ||
      status.includes(query)
    );
  });

  const pendingList = filteredPermits.filter((p) => p.status === 'Pending');
  const historyList = filteredPermits.filter((p) => p.status !== 'Pending');

  if (loading)
    return (
      <div className="mt-10 text-center text-white/80">
        Loading permits...
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div
        className="
          animate-glass
          rounded-[1.75rem]
          border border-white/25
          bg-white/[0.03]
          px-5 py-5
          backdrop-blur-[10px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
          space-y-6
        "
      >
        <h1 className="text-2xl font-semibold text-white">
          Permit
        </h1>

        {/* Student Create Form */}
        {user.role === 'student' && <CreatePermitForm onCreate={handleCreate} user={user} />}

        {/* Search Bar – glass pill */}
        <div
          className="
            rounded-[1.75rem]
            border border-white/18
            bg-white/[0.02]
            px-4 py-3
            backdrop-blur-[8px]
            shadow-[inset_0_0_16px_rgba(255,255,255,0.16)]
          "
        >
          <div className="relative w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/60" />
            <input
              type="text"
              placeholder="Search permits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                h-11 w-full rounded-full border border-white/25 bg-white/[0.04]
                pl-10 pr-4 text-sm text-white
                placeholder:text-white/60
                outline-none backdrop-blur-[6px]
                shadow-[inset_0_0_12px_rgba(255,255,255,0.12)]
              "
            />
          </div>
        </div>

        {/* Pending Requests */}
        <div
          className="
            rounded-2xl border border-white/20
            bg-white/[0.03]
            shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
          "
        >
          <h2 className="flex items-center border-b border-white/15 bg-white/[0.03] px-5 py-4 text-sm font-semibold text-white">
            <ClockIcon className="mr-2 h-5 w-5 text-white-300" />
            {user.role === 'student' ? 'My Pending Requests' : 'Pending Approvals'}
            <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/75">
              {pendingList.length}
            </span>
          </h2>

          <div className="divide-y divide-white/10">
            {pendingList.length === 0 && (
              <p className="px-5 py-5 text-sm text-white/60">
                No pending requests found.
              </p>
            )}
            {pendingList.map((permit) => (
              <PermitCard
                key={permit._id}
                permit={permit}
                user={user}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
                isHistory={false}
              />
            ))}
          </div>
        </div>

        {/* Permit History */}
        <div
          className="
            rounded-2xl border border-white/18
            bg-white/[0.02]
            shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
          "
        >
          <h2 className="flex items-center border-b border-white/15 bg-white/[0.02] px-5 py-4 text-sm font-semibold text-white/85">
            <CheckCircleIcon className="mr-2 h-5 w-5 text-white" />
            Permit History
            <span className="ml-2 rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70">
              {historyList.length}
            </span>
          </h2>

          <div className="divide-y divide-white/10">
            {historyList.length === 0 && (
              <p className="px-5 py-5 text-sm text-white/60">
                No history found.
              </p>
            )}
            {historyList.map((permit) => (
              <PermitCard
                key={permit._id}
                permit={permit}
                user={user}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
                isHistory={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ----------------- CARD ----------------- */

const PermitCard = ({ permit, user, onStatusUpdate, onDelete, isHistory }) => {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between hover:bg-white/[0.03] transition-colors">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`
              rounded-full px-2 py-1 font-semibold
              ${getStatusBadge(permit.status)}
            `}
          >
            {permit.status}
          </span>

          {/* TIMEZONE FIX: local date */}
          <span className="text-white/60">
            {new Date(permit.date).toLocaleDateString('en-CA')}
          </span>

          {permit.isFullDay ? (
            <span className="rounded-full bg-white-500/20 px-2 py-0.5 text-[11px] font-medium text-white-100 border border-white-300/50">
              Full Day
            </span>
          ) : (
            <span className="rounded-full bg-white-500/20 px-2 py-0.5 text-[11px] font-medium text-white-100 border border-white-300/50">
              {permit.class?.name || 'Unknown Class'}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-white">
          {permit.student?.name}
        </p>
        <p className="text-xs italic text-white/80">
          “{permit.reason}”
        </p>
        {permit.fileUrl && (
          <a
            href={permit.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="
              mt-1 inline-flex items-center text-xs font-medium
              text-white-200 hover:text-white-100 hover:underline
            "
          >
            <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
            View Proof
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        {/* Approve / Reject (teacher/admin, only pending) */}
        {user.role !== 'student' && !isHistory && (
          <>
            <button
              onClick={() => onStatusUpdate(permit._id, 'Approved')}
              className="
                inline-flex h-11 items-center
                rounded-full border border-white-300/70
                bg-white-400/30 px-4 text-xs font-semibold text-white-50
                hover:bg-white-400/45
                transition
              "
            >
              <CheckCircleIcon className="mr-1 h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => onStatusUpdate(permit._id, 'Rejected')}
              className="
                inline-flex h-11 items-center
                rounded-full border border-white-300/70
                bg-white-400/30 px-4 text-xs font-semibold text-white-50
                hover:bg-white-400/45
                transition
              "
            >
              <XCircleIcon className="mr-1 h-4 w-4" />
              Reject
            </button>
          </>
        )}

        {/* Delete (admin, history only) */}
        {user.role === 'admin' && isHistory && (
          <button
            onClick={() => onDelete(permit._id)}
            title="Delete Record"
            className="
              flex h-11 w-11 items-center justify-center
              rounded-full border border-white/25
              bg-white/[0.04] text-white-300
              shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]
              hover:bg-white-500/30 hover:text-white-50
              transition
            "
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ----------------- CREATE FORM ----------------- */

const CreatePermitForm = ({ onCreate, user }) => {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date());
  const [isFullDay, setIsFullDay] = useState(false);
  const [classId, setClassId] = useState('');

  const [allClasses, setAllClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);

  const [file, setFile] = useState(null);

  // Fetch all enrolled classes once
  useEffect(() => {
    api.get('/classes').then((res) => {
      const myClasses = res.data.filter((c) =>
        c.students.some((s) => s === user._id || s._id === user._id)
      );
      setAllClasses(myClasses);
    });
  }, [user._id]);

  // Filter classes whenever the date changes
  useEffect(() => {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const currentDayName = dayNames[date.getDay()];

    const classesOnDay = allClasses.filter((c) => c.day === currentDayName);
    setFilteredClasses(classesOnDay);

    if (classId && !classesOnDay.find((c) => c._id === classId)) {
      setClassId('');
    }
  }, [date, allClasses, classId]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!reason) return alert('Reason required');
    if (isFullDay && filteredClasses.length === 0) {
      return alert(`You have no classes on ${date.toLocaleDateString('en-US', { weekday: 'long' })}.`);
    }
    if (!isFullDay && !classId) return alert('Please select a class OR check Full Day');

    // Build Form Data
    const formData = new FormData();
    formData.append('reason', reason);
    
    // Fix Date Timezone issue
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    const dateString = localDate.toISOString().split('T')[0];
    formData.append('date', dateString);
    
    formData.append('isFullDay', isFullDay);
    if (!isFullDay && classId) formData.append('classId', classId);
    if (file) formData.append('file', file);

    try {
      setIsSubmitting(true);
      
      // WAIT for the parent to finish (alert + refresh)
      await onCreate(formData);

      // If we get here, it was successful. Now we clear the form.
      setReason('');
      setFile(null);
      setClassId('');
      setIsFullDay(false);
      
    } catch (error) {
      // If error, inputs stay filled so user can fix them
      console.log("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        rounded-2xl border border-white/20
        bg-white/[0.02] p-5
        backdrop-blur-[8px]
        shadow-[inset_0_0_18px_rgba(255,255,255,0.16)]
      "
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        Submit New Permit Request
      </h2>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Date */}
        <div>
        
          <DatePicker
            selected={date}
            onChange={setDate}
            className="
              h-11 w-full rounded-full border border-white/25
              bg-white/[0.04] px-4 text-xs text-white
              outline-none backdrop-blur-[6px]
            "
          />
          
        </div>

        {/* Full-day toggle */}
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="fullDay"
            checked={isFullDay}
            onChange={(e) => {
              setIsFullDay(e.target.checked);
              if (e.target.checked) setClassId('');
            }}
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
          <label
            htmlFor="fullDay"
            className="ml-2 cursor-pointer text-xs font-medium text-white/90 select-none"
          >
            Full Day Absence
          </label>
        </div>

        {/* Class select (if not full day) */}
        {!isFullDay && (
          <div className="md:col-span-2 animate-fade-in">
            <div className="relative">
              <GlassSelect
                value={classId}
                onChange={setClassId}
                className="w-full"
                options={[
                  { value: '', label: 'Select a Class' },
                  ...(filteredClasses.length === 0
                    ? [{ value: '__none', label: 'No classes on this day' }]
                    : filteredClasses.map(c => ({
                        value: c._id,
                        label: `${c.name} (${c.startTime} - ${c.endTime})`
                      })))
                ]}
              >

                <option value="">Select a Class</option>

                {filteredClasses.length === 0 ? (
                  <option disabled>No classes on this day</option>
                ) : (
                  filteredClasses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.startTime} - {c.endTime})
                    </option>
                  ))
                )}
              </GlassSelect>

              {/* custom arrow, not cramped to the edge */}
              
            </div>

          </div>
        )}

        {/* Reason */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-white/70">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="
              h-24 w-full rounded-2xl border border-white/20
              bg-white/[0.03] p-3 text-sm text-white
              outline-none
            "
          />
        </div>

        {/* File upload */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-white/70">
            Upload Proof (Medical Certificate, etc.)
          </label>
          <div className="flex items-center gap-3">
            <label
              className="
                flex h-11 cursor-pointer items-center
                rounded-full border border-white/25 bg-white/[0.06]
                px-4 text-xs font-medium text-white
                shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
                hover:bg-white/[0.12]
              "
            >
              <PaperClipIcon className="mr-2 h-4 w-4" />
              {file ? 'Change File' : 'Choose File'}
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            <span className="truncate text-xs italic text-white/60">
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="
          h-11 rounded-full border border-white/25
          bg-white/[0.16] px-6 text-xs font-semibold
          text-white shadow-[inset_0_0_16px_rgba(255,255,255,0.24)]
          hover:bg-white/[0.22]
          active:scale-[0.97]
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isSubmitting ? 'Sending...' : 'Submit Request'}
      </button>
    </form>
  );
};

/* ----------------- STATUS BADGE COLORS ----------------- */

const getStatusBadge = (status) => {
  switch (status) {
    case 'Approved':
      return 'bg-white-500/20 text-white-100 border border-white-300/50';
    case 'Rejected':
      return 'bg-white-500/20 text-white-100 border border-white-300/50';
    default:
      return 'bg-white-500/20 text-white-100 border border-white-300/50';
  }
};

export default Permit;
