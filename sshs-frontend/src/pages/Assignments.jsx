import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  CalendarIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

/* ----------------- Helpers ----------------- */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/* ----------------- GlassSelect (custom) ----------------- */
const GlassSelect = ({ value, onChange, options = [], className = '', placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected =
    options.find((o) => o.value === value) ??
    { label: placeholder ?? (options[0] && options[0].label) ?? '' };

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

/* ----------------- Main Assignments Component ----------------- */
const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [mySubmissions, setMySubmissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  // Modals
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: assignmentsData } = await api.get('/assignments');
      setAssignments(assignmentsData);

      const { data: allClasses } = await api.get('/classes');
      if (user.role === 'admin') {
        setClasses(allClasses);
      } else if (user.role === 'teacher') {
        setClasses(
          allClasses.filter(
            (c) => c.teacher?._id === user._id || c.teacher === user._id
          )
        );
      } else {
        setClasses(
          allClasses.filter((c) =>
            c.students.some((s) => s._id === user._id || s === user._id)
          )
        );
      }

      if (user.role === 'student') {
        const { data: subs } = await api.get('/assignments/my-submissions');
        const subMap = {};
        subs.forEach((s) => (subMap[s.assignment] = s));
        setMySubmissions(subMap);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers (logic preserved) ---
  const handlePost = async (formData) => {
    try {
      const { data } = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAssignments([data, ...assignments]);
      alert('Posted!');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed');
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      const { data } = await api.put(`/assignments/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAssignments(
        assignments.map((a) => (a._id === id ? { ...a, ...data } : a))
      );
      setShowEditModal(false);
      alert('Updated!');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments(assignments.filter((a) => a._id !== id));
    } catch (e) {
      alert('Failed');
    }
  };

  const handleSubmitAssignment = async (file) => {
    if (!selectedAssignment) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post(
        `/assignments/${selectedAssignment._id}/submit`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      alert('Submitted!');
      setMySubmissions({ ...mySubmissions, [selectedAssignment._id]: data });
      setShowSubmitModal(false);
    } catch (e) {
      alert('Failed');
    }
  };

  // --- Filters & derived lists ---
  const filteredClassesForDropdown = selectedGradeFilter
    ? classes.filter((c) => c.gradeLevel?.toString() === selectedGradeFilter)
    : classes;

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassFilter
      ? a.class?._id === selectedClassFilter
      : true;
    const matchesDate = selectedDateFilter
      ? new Date(a.dueDate).toDateString() ===
        selectedDateFilter.toDateString()
      : true;
    const matchesGrade = selectedGradeFilter
      ? a.class?.gradeLevel?.toString() === selectedGradeFilter
      : true;
    return matchesSearch && matchesClass && matchesDate && matchesGrade;
  });

  return (
    <div className="mx-auto max-w-4xl pb-10 px-3 sm:px-4">
      {/* Main glass card, like Dashboard */}
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
          Assignments
        </h1>

        {/* Teacher create form */}
        {user.role === 'teacher' && (
          <CreateAssignmentForm classes={classes} onPost={handlePost} />
        )}

        {/* Filters bar inside a pill card */}
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
          <div className="flex flex-col gap-3 items-stretch md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search assignments"
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

            {/* Date filter */}
            <div className="w-full md:w-40">
              <DatePicker
                selected={selectedDateFilter}
                onChange={setSelectedDateFilter}
                placeholderText="Filter by Date"
                isClearable
                dateFormat="dd-MM-yyyy"
                className="
                  h-11 w-full rounded-full border border-white/25 bg-white/[0.04]
                  px-4 text-xs text-white
                  placeholder:text-white/60
                  outline-none backdrop-blur-[6px]
                "
              />
            </div>

            {/* Grade filter */}
            {(user.role === 'admin' || user.role === 'teacher') && (
              <div className="w-full md:w-40">
                <GlassSelect
                  value={selectedGradeFilter}
                  onChange={(v) => {
                    setSelectedGradeFilter(v);
                    setSelectedClassFilter('');
                  }}
                  options={[
                    { value: '', label: 'All Grades' },
                    { value: '10', label: 'Grade 10' },
                    { value: '11', label: 'Grade 11' },
                    { value: '12', label: 'Grade 12' },
                  ]}
                  placeholder="All Grades"
                />
              </div>
            )}

            {/* Class filter */}
            <div className="w-full md:w-40">
              <GlassSelect
                value={selectedClassFilter}
                onChange={setSelectedClassFilter}
                options={[
                  { value: '', label: 'All Classes' },
                  ...filteredClassesForDropdown.map((c) => ({
                    value: c._id,
                    label: c.name,
                  })),
                ]}
                placeholder="All Classes"
              />
            </div>
          </div>
        </div>

        {/* Assignment list */}
        <div className="grid gap-4">
          {filteredAssignments.length === 0 && (
            <p className="text-center text-white/60">
              No assignments found.
            </p>
          )}
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment._id}
              assignment={assignment}
              user={user}
              mySubmission={mySubmissions[assignment._id]}
              onViewSubmissions={() => {
                setSelectedAssignment(assignment);
                setShowSubmissionsModal(true);
              }}
              onOpenSubmitModal={() => {
                setSelectedAssignment(assignment);
                setShowSubmitModal(true);
              }}
              onEdit={() => {
                setSelectedAssignment(assignment);
                setShowEditModal(true);
              }}
              onDelete={() => handleDelete(assignment._id)}
            />
          ))}
        </div>
      </div>

      {showSubmitModal && (
        <SubmitModal
          assignment={selectedAssignment}
          onSubmit={handleSubmitAssignment}
          onClose={() => setShowSubmitModal(false)}
          existingSubmission={mySubmissions[selectedAssignment._id]}
        />
      )}
      {showSubmissionsModal && (
        <SubmissionsModal
          assignment={selectedAssignment}
          onClose={() => setShowSubmissionsModal(false)}
        />
      )}
      {showEditModal && (
        <EditAssignmentModal
          assignment={selectedAssignment}
          classes={classes}
          onUpdate={handleUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

/* ----------------- Create Assignment Form ----------------- */
const CreateAssignmentForm = ({ classes, onPost }) => {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [classId, setClassId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formGrade, setFormGrade] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !dueDate || !classId)
      return alert('Title, Class, and Due Date required');
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('instructions', instructions);
    formData.append('dueDate', dueDate.toISOString());
    formData.append('classId', classId);
    if (file) formData.append('file', file);
    await onPost(formData);
    setTitle('');
    setInstructions('');
    setDueDate(null);
    setFile(null);
    setClassId('');
    setFormGrade('');
    setLoading(false);
  };

  const filteredFormClasses = formGrade
    ? classes.filter((c) => c.gradeLevel?.toString() === formGrade)
    : classes;

  return (
    <form
      onSubmit={handleSubmit}
      className="
        mb-4 rounded-2xl border border-white/20
        bg-white/[0.02] p-5
        backdrop-blur-[8px]
        shadow-[inset_0_0_18px_rgba(255,255,255,0.16)]
      "
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        Create Assignment
      </h2>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Title */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="
            h-11 w-full rounded-full border border-white/25 bg-white/[0.04]
            px-4 text-xs text-white outline-none
          "
        />

        {/* Select Due Date (beside Title) */}
        <DatePicker
          selected={dueDate}
          onChange={setDueDate}
          showTimeSelect
          timeIntervals={30}
          timeCaption="Time"
          dateFormat="dd-MM-yyyy HH:mm"
          placeholderText="Select Due Date"
          className="
            h-11 w-full rounded-full border border-white/25 bg-white/[0.04]
            px-4 text-xs text-white outline-none
          "
        />

        {/* Select Grade */}
        <GlassSelect
          value={formGrade}
          onChange={(v) => {
            setFormGrade(v);
            setClassId('');
          }}
          options={[
            { value: '', label: 'Select Grade' },
            { value: '10', label: 'Grade 10' },
            { value: '11', label: 'Grade 11' },
            { value: '12', label: 'Grade 12' },
          ]}
          placeholder="Select Grade"
        />

        {/* Select Class */}
        <GlassSelect
          value={classId}
          onChange={setClassId}
          options={[
            { value: '', label: 'Select Class' },
            ...filteredFormClasses.map((c) => ({
              value: c._id,
              label: c.name,
            })),
          ]}
          placeholder="Select Class"
        />
      </div>

      <textarea
        placeholder="Instructions..."
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        className="
          mb-4 h-24 w-full rounded-lg border border-white/20
          bg-white/[0.03] p-3 text-sm text-white
          outline-none
        "
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <label
            className="
              flex h-11 cursor-pointer items-center
              rounded-full border border-white/25 bg-white/[0.04]
              px-4 text-xs text-white
            "
          >
            <PaperClipIcon className="mr-2 h-4 w-4" />
            {file ? 'Change PDF' : 'Attach PDF'}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <span className="truncate text-xs text-white/60">
            {file ? file.name : 'No file chosen'}
          </span>
        </div>

        <button
          disabled={loading}
          className="
            h-11 rounded-full border border-white/25
            bg-white/[0.12] px-5 text-xs font-semibold
            text-white shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]
            hover:bg-white/[0.18]
          "
        >
          {loading ? 'Posting...' : 'Post Assignment'}
        </button>
      </div>
    </form>
  );
};

/* ----------------- Assignment Card ----------------- */
const AssignmentCard = ({
  assignment,
  user,
  mySubmission,
  onViewSubmissions,
  onOpenSubmitModal,
  onEdit,
  onDelete,
}) => {
  const isOverdue = new Date() > new Date(assignment.dueDate);
  const formattedDate = formatDate(assignment.dueDate);
  const isOwner =
    assignment.teacher?._id === user._id || assignment.teacher === user._id;
  const canEdit =
    user.role === 'admin' || (user.role === 'teacher' && isOwner);

  return (
    <div
      className="
        flex flex-col gap-4 rounded-2xl border border-white/20
        bg-white/[0.03] p-5
        shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
        md:flex-row
      "
    >
      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-white">
            {assignment.title}
          </h3>
          <span className="rounded-full border border-white/18 bg-white/[0.06] px-2 py-0.5 text-xs text-white/90">
            Grade {assignment.class?.gradeLevel || '?'} •{' '}
            {assignment.class?.name || 'Unknown Class'}
          </span>
        </div>

        <p className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/80">
          <CalendarIcon className="h-4 w-4" /> Due: {formattedDate}
          {isOverdue && (
            <span className="ml-1 text-xs text-white/85">(Overdue)</span>
          )}
        </p>

        <p className="mb-4 whitespace-pre-wrap text-sm text-white/70">
          {assignment.instructions}
        </p>

        <div className="flex flex-wrap gap-2">
          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="
              h-11 inline-flex items-center
              rounded-full border border-white/20 bg-white/[0.04]
              px-4 text-xs text-white hover:bg-white/[0.08]
              "
            >
              <ArrowDownTrayIcon className="mr-1 inline-block h-3 w-3" />
              Download Reference
            </a>
          )}

          {user.role === 'student' && mySubmission && (
            <a
              href={mySubmission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="
                h-11 inline-flex items-center
                rounded-full border border-white/20 bg-white/[0.06]
                px-4 text-xs text-white hover:bg-white/[0.08]
              "
            >
              <ArrowDownTrayIcon className="mr-1 inline-block h-3 w-3" />
              My Latest Submission
            </a>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:min-w-[150px]">
        {user.role === 'student' && (
          <button
            onClick={onOpenSubmitModal}
            className="
              h-11 w-full rounded-full bg-white/[0.12]
              px-5 text-sm text-white
              hover:bg-white/[0.18]
            "
          >
            {isOverdue
              ? mySubmission
                ? 'Re-submit (Late)'
                : 'Submit Late'
              : mySubmission
              ? 'Re-submit'
              : 'Submit'}
          </button>
        )}

        {(user.role === 'teacher' || user.role === 'admin') && (
          <>
            <button
              onClick={onViewSubmissions}
              className="
                h-11 w-full rounded-full bg-white/[0.12]
                px-5 text-sm text-white
              hover:bg-white/[0.18]
              "
            >
              <UserGroupIcon className="mr-2 inline-block h-4 w-4" />
              Submissions
            </button>

            {canEdit && (
              <div className="mt-1 flex gap-2">
                <button
                  onClick={onEdit}
                  className="
                    h-11 flex flex-1 items-center justify-center
                    rounded-full border border-white/20
                  bg-white/[0.04] px-4 text-white hover:bg-white/[0.08]
                  "
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="
                    h-11 flex flex-1 items-center justify-center
                    rounded-full border border-white/20
                  bg-white/[0.04] px-4 text-white hover:bg-white/[0.08]
                  "
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ----------------- Submit Modal ----------------- */
const SubmitModal = ({ assignment, onSubmit, onClose, existingSubmission }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a file');
    setLoading(true);
    await onSubmit(file);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-[10px] shadow-[inset_0_0_20px_rgba(255,255,255,0.16)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Submit Assignment
          </h3>
          <button onClick={onClose} className="text-white/70">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-white/70">
            Assignment:{' '}
            <span className="font-medium text-white">
              {assignment.title}
            </span>
          </p>
          {existingSubmission && (
            <p className="mt-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
              Last submitted: {formatDate(existingSubmission.submittedAt)}
            </p>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.02] p-3">
            <label
              className="
                flex cursor-pointer items-center rounded-full
                border border-white/20 bg-white/[0.04]
                px-3 py-2 text-sm text-white
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
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/70">
                {file ? (
                  file.name
                ) : (
                  <span className="italic text-white/50">
                    No file selected
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/50">
            * Any file type allowed. File will be automatically zipped.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-11 rounded-full px-5 text-white/70"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              h-11 rounded-full bg-white/[0.12]
              px-5 text-sm text-white hover:bg-white/[0.18]
            "
          >
            {loading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------- Submissions Modal ----------------- */
const SubmissionsModal = ({ assignment, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!assignment) return;
    api
      .get(`/assignments/${assignment._id}/submissions`)
      .then((res) => setSubmissions(res.data));
    if (assignment.class && assignment.class.students) {
      setStudents(assignment.class.students);
    }
  }, [assignment]);

  const filteredStudents = students.filter((studentData) => {
    const studentName =
      typeof studentData === 'object' ? studentData.name : 'Unknown';
    return studentName.toLowerCase().includes(search.toLowerCase());
  });

  const handleDownloadAll = async () => {
    if (submissions.length === 0)
      return alert('No submissions to download.');
    setDownloading(true);
    try {
      const response = await api.get(
        `/assignments/${assignment._id}/download-all`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${assignment.title}_Submissions.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to download submissions');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-[10px] shadow-[inset_0_0_20px_rgba(255,255,255,0.16)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Submissions for {assignment.title}
          </h3>
          <button onClick={onClose} className="text-white/70">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/60" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                h-11 w-full rounded-full border border-white/25 bg-white/[0.03]
                pl-10 pr-4 text-sm text-white
                outline-none
              "
            />
          </div>
          <button
            onClick={handleDownloadAll}
            disabled={downloading || submissions.length === 0}
            className="
              h-11 w-full md:w-auto rounded-full bg-white/[0.12]
              px-4 text-sm text-white
              hover:bg-white/[0.18]
              disabled:opacity-50
            "
          >
            {downloading ? (
              'Zipping...'
            ) : (
              <>
                <ArrowDownTrayIcon className="mr-2 inline-block h-4 w-4" />
                Download All
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm text-white/80">
            <thead className="text-xs text-white/60">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Submitted At</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredStudents.map((studentData) => {
                const student =
                  typeof studentData === 'object'
                    ? studentData
                    : { _id: studentData, name: 'Unknown', email: 'Unknown' };
                const sub = submissions.find(
                  (s) => s.student._id === student._id
                );
                const isLate =
                  sub && new Date(sub.submittedAt) > new Date(assignment.dueDate);
                let lateText = '';
                if (isLate) {
                  const diff =
                    new Date(sub.submittedAt) - new Date(assignment.dueDate);
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor(
                    (diff / (1000 * 60 * 60)) % 24
                  );
                  lateText = `${days}d ${hours}h late`;
                }

                return (
                  <tr key={student._id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">
                      {student.name}
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
                        isLate ? (
                          <span className="text-white/90">
                            LATE ({lateText})
                          </span>
                        ) : (
                          <span className="text-white/90">On Time</span>
                        )
                      ) : (
                        <span className="text-white/70">Missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub ? formatDate(sub.submittedAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {sub && (
                        <a
                          href={sub.fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-white/90 underline"
                        >
                          <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
                          Download Zip
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ----------------- Edit Assignment Modal ----------------- */
const EditAssignmentModal = ({ assignment, classes, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    title: assignment.title,
    instructions: assignment.instructions,
    dueDate: new Date(assignment.dueDate),
    classId: assignment.class?._id || '',
  });
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('instructions', formData.instructions);
    data.append('dueDate', formData.dueDate.toISOString());
    data.append('classId', formData.classId);
    if (file) data.append('file', file);
    onUpdate(assignment._id, data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-[10px] shadow-[inset_0_0_20px_rgba(255,255,255,0.16)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Edit Assignment
          </h3>
          <button onClick={onClose} className="text-white/70">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="
              w-full h-11 rounded-full border border-white/20
            bg-white/[0.03] px-5 text-sm text-white
              outline-none
            "
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <GlassSelect
              value={formData.classId}
              onChange={(v) =>
                setFormData({ ...formData, classId: v })
              }
              options={classes.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
              placeholder="Select class"
            />
            <DatePicker
              selected={formData.dueDate}
              onChange={(d) =>
                setFormData({ ...formData, dueDate: d })
              }
              showTimeSelect
              timeIntervals={30}
              timeCaption="Time"
              dateFormat="dd-MM-yyyy HH:mm"
              className="
                h-11 w-full rounded-full border border-white/20
                bg-white/[0.03] px-3 text-xs text-white
                outline-none
              "
            />
          </div>

          <textarea
            value={formData.instructions}
            onChange={(e) =>
              setFormData({
                ...formData,
                instructions: e.target.value,
              })
            }
            className="
              h-24 w-full rounded-lg border border-white/20
              bg-white/[0.03] p-3 text-sm text-white
              outline-none
            "
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center rounded-2xl border border-white/12 bg-white/[0.02] p-3">
            <label
              className="
                flex cursor-pointer items-center rounded-full
                border border-white/20 bg-white/[0.04]
                px-3 py-2 text-sm text-white
              "
            >
              <PaperClipIcon className="mr-2 h-4 w-4" />
              Replace PDF
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            <span className="text-sm text-white/60 italic">
              {file ? file.name : 'Current file will be kept'}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full px-5 text-white/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                h-11 rounded-full bg-white/[0.12]
                px-5 text-sm text-white
              hover:bg-white/[0.18]

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

export default Assignments;
