import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  StarIcon,
  PaperClipIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const formatDate = (dateString) => {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]); // All classes for TimeTable
  const [teachers, setTeachers] = useState([]); // For Admin TimeTable filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Viewers List Modal State
  const [isViewersModalOpen, setIsViewersModalOpen] = useState(false);
  const [selectedViewers, setSelectedViewers] = useState([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [annRes, classRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/classes'),
      ]);
      setAnnouncements(annRes.data);
      setClasses(classRes.data);

      // If Admin, fetch teachers list for the TimeTable dropdown
      if (user.role === 'admin') {
        const teacherRes = await api.get('/auth/users/teacher');
        setTeachers(teacherRes.data);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newAnnouncement) => {
    setAnnouncements([newAnnouncement, ...announcements]);
  };

  const handleEditSuccess = (updatedAnnouncement) => {
    setAnnouncements(
      announcements.map((ann) =>
        ann._id === updatedAnnouncement._id ? updatedAnnouncement : ann
      )
    );
    setIsEditModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await api.delete(`/announcements/${id}`);
        setAnnouncements(announcements.filter((ann) => ann._id !== id));
      } catch (err) {
        setError('Failed to delete.');
      }
    }
  };

  const handleViewPdf = async (id, pdfUrl) => {
    if (user.role === 'student') {
      try {
        await api.put(`/announcements/${id}/view`);
        fetchData(); // Refresh to update view count
      } catch (err) {
        // ignore
      }
    }
    window.open(pdfUrl, '_blank');
  };

  const handleShowViewers = (viewers) => {
    setSelectedViewers(viewers);
    setIsViewersModalOpen(true);
  };

  // --- FILTER & SPLIT LOGIC ---
  const filteredAnnouncements = announcements.filter((ann) =>
    ann.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedList = filteredAnnouncements.filter((ann) => ann.isPinned);
  const generalList = filteredAnnouncements.filter((ann) => !ann.isPinned);


  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      {/* --- TIME TABLE SECTION --- */}
      <div
        className="
          animate-glass
          rounded-[1.75rem]
          border border-white/25
          bg-white/[0.03]
          backdrop-blur-[10px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
          px-5 py-5
        "
      >
        <h1 className="mb-4 text-2xl font-semibold text-white">
          Schedule
        </h1>
        <TimeTable user={user} classes={classes} teachers={teachers} />
      </div>

      {/* --- ANNOUNCEMENTS SECTION --- */}
      <div
        className="
          animate-glass
          rounded-[1.75rem]
          border border-white/25
          bg-white/[0.03]
          backdrop-blur-[10px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
          px-5 py-5
        "
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Announcements</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-white/40 bg-white/[0.06] px-4 py-3 text-sm text-white/90 backdrop-blur-[6px]">
            {error}
          </div>
        )}

        {(user.role === 'teacher' || user.role === 'admin') && (
          <AnnouncementUploadForm
            onUploadSuccess={handleUploadSuccess}
            isAdmin={user.role === 'admin'}
          />
        )}

        {/* 🔹 Search – same pill height as Title / dropdowns */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-white/50" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              h-11 w-full rounded-full border border-white/25 bg-white/[0.05]
              px-10 text-xs text-white
              placeholder:text-white/60
              outline-none
              backdrop-blur-[8px]
              shadow-[inset_0_0_14px_rgba(255,255,255,0.18)]
              focus:border-white/60
              transition-all
            "
          />
        </div>

        {pinnedList.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center text-sm font-semibold text-white/90">
              <StarIconSolid className="mr-2 h-5 w-5 text-white" /> Pinned
              Announcements
            </h2>
            <div className="space-y-3">
              {pinnedList.map((ann) => (
                <AnnouncementCard
                  key={ann._id}
                  ann={ann}
                  user={user}
                  onDelete={handleDelete}
                  onEdit={() => {
                    setEditingAnnouncement(ann);
                    setIsEditModalOpen(true);
                  }}
                  onView={handleViewPdf}
                  onShowViewers={() => handleShowViewers(ann.views)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-3 text-sm font-semibold text-white/80">
            General Announcements
          </h2>
          {generalList.length === 0 ? (
            <p className="text-sm text-white/60">No announcements found.</p>
          ) : (
            <div className="space-y-3">
              {generalList.map((ann) => (
                <AnnouncementCard
                  key={ann._id}
                  ann={ann}
                  user={user}
                  onDelete={handleDelete}
                  onEdit={() => {
                    setEditingAnnouncement(ann);
                    setIsEditModalOpen(true);
                  }}
                  onView={handleViewPdf}
                  onShowViewers={() => handleShowViewers(ann.views)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EditAnnouncementModal
          announcement={editingAnnouncement}
          isAdmin={user.role === 'admin'}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {isViewersModalOpen && (
        <ViewersModal
          viewers={selectedViewers}
          onClose={() => setIsViewersModalOpen(false)}
        />
      )}
    </div>
  );
};

/* ----------------- GLASS SELECT (CUSTOM DROPDOWN) ----------------- */

const GlassSelect = ({ value, onChange, options, className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected =
    options.find((opt) => opt.value === value) || options[0] || { label: '' };

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // 🔹 Match pill height with Post form (h-11)
  const baseButton =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.06] px-4 text-xs text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] flex items-center justify-between gap-2 transition-all hover:bg-white/[0.1]';

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={baseButton}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 flex-shrink-0 text-white/80 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="
            absolute right-0 z-30 mt-1 w-max min-w-full
            rounded-2xl border overflow-hidden border-white/25 bg-black/[0.75]
            backdrop-blur-[14px]
            shadow-[inset_0_0_18px_rgba(255,255,255,0.25)]
          "
        >
          <ul className="max-h-56 overflow-y-auto py-1 text-xs text-white">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-left transition-all ${
                      active
                        ? 'bg-black/[0.50] font-semibold'
                        : 'bg-transparent hover:bg-black/[0.50]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ----------------- TIME TABLE ----------------- */

const TimeTable = ({ user, classes, teachers }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [scheduleData, setScheduleData] = useState([]);

  // Admin Filter States
  const [filterType, setFilterType] = useState('grade');
  const [selectedGrade, setSelectedGrade] = useState('10');
  const [selectedMajor, setSelectedMajor] = useState('Science');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  useEffect(() => {
    let filtered = [];

    if (user.role === 'student') {
      // Student: Show classes I am enrolled in
      filtered = classes.filter((c) =>
        c.students.some((s) => s._id === user._id || s === user._id)
      );
    } else if (user.role === 'teacher') {
      // Teacher: Show classes I teach
      filtered = classes.filter(
        (c) => c.teacher?._id === user._id || c.teacher === user._id
      );
    } else if (user.role === 'admin') {
      // Admin Logic
      if (filterType === 'grade') {
        // Show MANDATORY classes + classes matching SELECTED MAJOR for that grade
        filtered = classes.filter(
          (c) =>
            c.gradeLevel.toString() === selectedGrade &&
            (c.category === 'Mandatory' || c.category === selectedMajor)
        );
      } else if (filterType === 'teacher' && selectedTeacher) {
        // Show all classes for the selected teacher
        filtered = classes.filter(
          (c) => c.teacher?._id === selectedTeacher || c.teacher === selectedTeacher
        );
      }
    }

    setScheduleData(filtered);
  }, [user, classes, filterType, selectedGrade, selectedMajor, selectedTeacher]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-white/15 pb-3 md:flex-row md:items-center">
        <h2 className="flex items-center text-sm font-semibold text-white">
          <CalendarIcon className="mr-2 h-5 w-5 text-white/80" />
          {user.role === 'admin' ? 'Master Schedule View' : 'My Weekly Schedule'}
        </h2>

        {/* Admin Controls */}
        {user.role === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <GlassSelect
              value={filterType}
              onChange={(val) => {
                setFilterType(val);
                setSelectedTeacher('');
              }}
              options={[
                { value: 'grade', label: 'By Grade & Major' },
                { value: 'teacher', label: 'By Teacher' },
              ]}
              className="min-w-[140px]"
            />

            {filterType === 'grade' ? (
              <>
                <GlassSelect
                  value={selectedGrade}
                  onChange={setSelectedGrade}
                  options={[
                    { value: '10', label: 'Grade 10' },
                    { value: '11', label: 'Grade 11' },
                    { value: '12', label: 'Grade 12' },
                  ]}
                  className="min-w-[110px]"
                />
                <GlassSelect
                  value={selectedMajor}
                  onChange={setSelectedMajor}
                  options={[
                    { value: 'Science', label: 'Science' },
                    { value: 'Social', label: 'Social' },
                  ]}
                  className="min-w-[110px]"
                />
              </>
            ) : (
              <GlassSelect
                value={selectedTeacher}
                onChange={setSelectedTeacher}
                options={[
                  { value: '', label: 'Select Teacher' },
                  ...teachers.map((t) => ({
                    value: t._id,
                    label: t.name,
                  })),
                ]}
                className="min-w-[160px]"
              />
            )}
          </div>
        )}
      </div>

      {/* Grid Display */}
      <div
        className="
          grid grid-cols-1 overflow-hidden rounded-2xl border border-white/20 bg-white/[0.02]
          backdrop-blur-[10px] text-sm text-white
          md:grid-cols-5
        "
      >
        {days.map((day) => {
          const daysClasses = scheduleData
            .filter((c) => c.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={day}
              className="flex min-h-[150px] flex-col border-t border-white/10 first:border-t-0 md:border-l md:first:border-l-0"
            >
              <div className="border-b border-white/10 bg-white/[0.04] py-2 text-center text-xs font-semibold uppercase tracking-wide text-white/75">
                {day}
              </div>
              <div className="flex-1 space-y-2 p-2">
                {daysClasses.length === 0 && (
                  <p className="mt-4 text-center text-[11px] text-white/40">-</p>
                )}
                {daysClasses.map((c) => (
                  <div
                    key={c._id}
                    className="
                      rounded-xl border border-white/18 bg-white/[0.05]
                      p-2 text-xs text-white
                      shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]
                      transition-transform
                      hover:scale-[1.01]
                    "
                  >
                    <div className="text-[11px] font-semibold">{c.name}</div>
                    <div className="mt-1 flex items-center text-[10px] text-white/70">
                      <ClockIcon className="mr-1 h-3 w-3" /> {c.startTime} -{' '}
                      {c.endTime}
                    </div>
                    {user.role === 'admin' && (
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-white/60">
                        {filterType === 'grade'
                          ? `T: ${c.teacher?.name || 'TBA'}`
                          : `Grade ${c.gradeLevel}`}
                        {c.category !== 'Mandatory' && (
                          <span className="rounded-full bg-white/[0.16] px-1.5 py-0.5 text-[9px] text-white/90">
                            {c.category}
                          </span>
                        )}
                      </div>
                    )}
                    {c.category === 'Mandatory' &&
                      user.role === 'admin' &&
                      filterType === 'grade' && (
                        <span className="mt-1 inline-block rounded-full bg.white/[0.2] px-1.5 py-0.5 text-[9px] text-white/90">
                          Mandatory
                        </span>
                      )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ----------------- OTHER SUB-COMPONENTS ----------------- */

const ViewersModal = ({ viewers, onClose }) => {
  const [search, setSearch] = useState('');

  const filteredViewers = viewers.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="
          animate-glass
          relative w-full max-w-sm
          rounded-2xl border border-white/25
          bg-white/[0.06]
          px-5 py-4
          backdrop-blur-[12px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.2)]
        "
      >
        <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-2">
          <h3 className="flex items-center text-sm font-semibold text-white">
            <UserGroupIcon className="mr-2 h-5 w-5 text.white/80" /> Viewed By (
            {viewers.length})
          </h3>
          <button
            onClick={onClose}
            className="rounded-full border border-white/30 bg-white/[0.02] p-1 text-white/70 hover:bg-white/[0.08]"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search viewer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full rounded-full border border-white/25 bg-white/[0.04]
              px-8 py-1.5 text-xs text-white
              placeholder:text-white/60
              outline-none backdrop-blur-[8px]
            "
          />
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredViewers.length === 0 && (
            <p className="py-4 text-center text-xs text-white/60">
              No matching viewers.
            </p>
          )}
          <ul className="space-y-1.5">
            {filteredViewers.map((v, i) => (
              <li
                key={i}
                className="rounded-xl bg-white/[0.04] p-2 text-xs text-white/90 shadow-[inset_0_0_10px_rgba(255,255,255,0.16)]"
              >
                <span className="block font-medium">{v.name}</span>
                <span className="text-[11px] text-white/70">{v.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const AnnouncementCard = ({
  ann,
  user,
  onDelete,
  onEdit,
  onView,
  onShowViewers,
}) => {
  const hasViewed = ann.views.some(
    (v) => v._id === user._id || v === user._id
  );

  return (
    <div
      className={`
        flex flex-col justify-between gap-3 rounded-2xl border
        px-4 py-3 text-sm text-white
        shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]
        transition-transform
        hover:scale-[1.01]
        md:flex-row md:items-center
        ${
          ann.isPinned
            ? 'border-white/70 bg-white/[0.08]'
            : 'border-white/25 bg-white/[0.04]'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className="
            mt-1 flex h-11 w-11 items-center justify-center
            rounded-full border border-white/35
            bg-white/[0.07]
            backdrop-blur-[14px]
            shadow-[inset_0_0_18px_rgba(255,255,255,0.30)]
          "
        >
          <DocumentIcon className="h-5 w-5 text-white/85" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
            {ann.isPinned && (
              <span className="rounded-full border border-white/70 bg-white/[0.25] px-2 py-0.5 text-[10px] font-medium text-white">
                Pinned
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-white/65">
            Posted by{' '}
            <span className="font-medium">
              {ann.postedBy?.name || 'N/A'}
            </span>{' '}
            • {formatDate(ann.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {user.role === 'student' && (
          <>
            {hasViewed && (
              <CheckCircleIcon
                className="h-5 w-5 text-white"
                title="Viewed"
              />
            )}
            <button
              onClick={() => onView(ann._id, ann.pdfUrl)}
              className="
                h-11 inline-flex items-center justify-center gap-1
                rounded-full border border-white/30
              bg-white/[0.12] px-4
                text-xs font-medium text-white
                shadow-[inset_0_0_12px_rgba(255,255,255,0.22)]
              hover:bg-white/[0.2]
              "
            >
              <EyeIcon className="mr-1 h-4 w-4" /> View
            </button>
          </>
        )}

        {(user.role === 'admin' || user.role === 'teacher') && (
          <>
            <button
              onClick={onShowViewers}
              className="h-11 inline-flex items-center justify-center gap-1
                        rounded-full border border-white/30
                      bg-white/[0.12] px-4
                        text-xs text-white
                        shadow-[inset_0_0_12px_rgba(255,255,255,0.22)]
                      hover:bg-white/[0.2]"
              title="See who viewed"
            >
              <EyeIcon className="mr-1 h-4 w-4" /> {ann.views?.length || 0}
            </button>
            <a
              href={ann.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="h-11 inline-flex items-center justify-center gap-1
                        rounded-full border border-white/30
                      bg-white/[0.12] px-4
                        -xs text-white
                        shadow-[inset_0_0_12px_rgba(255,255,255,0.22)]
                      hover:bg-white/[0.2]"
              title="Download"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </a>
            {user.role === 'admin' && (
              <>
                <button
                  onClick={onEdit}
                  className="
                    h-11 inline-flex items-center justify-center gap-1
                    rounded-full border border-white/30
                  bg-white/[0.12] px-4 -xs text-white
                    shadow-[inset_0_0_12px_rgba(255,255,255,0.22)]
                  hover:bg-white/[0.2]
                  "
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(ann._id)}
                  className="
                    h-11 inline-flex items-center justify-center gap-1
                    rounded-full border border-white/30
                  bg-white/[0.12] px-4 -xs text-white
                    shadow-[inset_0_0_12px_rgba(255,255,255,0.22)]
                  hover:bg-white/[0.2]
                  "
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AnnouncementUploadForm = ({ onUploadSuccess, isAdmin }) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return alert('Title and PDF required.');

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    if (isAdmin) formData.append('isPinned', isPinned);

    try {
      const { data } = await api.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadSuccess(data);
      setTitle('');
      setFile(null);
      setIsPinned(false);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="
        mb-6 rounded-2xl border border-white/25 bg-white/[0.04]
        px-4 py-4 text-sm text-white
        backdrop-blur-[10px]
        shadow-[inset_0_0_18px_rgba(255,255,255,0.2)]
      "
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">
          Post New Announcement
        </h2>
      </div>

      <div className="flex flex-col items-end gap-4 md:flex-row">
        {/* Title – label removed, placeholder used */}
        <div className="w-full flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="
              w-full h-11 rounded-full border border-white/25 bg-white/[0.04]
              px-4 text-xs text-white
              placeholder:text-white/60
              outline-none backdrop-blur-[8px]
              shadow-[inset_0_0_12px_rgba(255,255,255,0.16)]
            "
          />
        </div>

        {/* PDF file – label removed */}
        <div className="w-full flex-1">
          <div className="flex items-center gap-3">
            <label
              className="
                flex w-full cursor-pointer items-center justify-center
                h-11 rounded-full border border-white/30 bg-white/[0.1]
                px-4 text-xs font-medium text-white
                shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
                md:w-auto
              "
            >
              <PaperClipIcon className="mr-2 h-4 w-4" />
              {file ? 'Change PDF' : 'Choose PDF'}
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            <span className="truncate text-[11px] text-white/60">
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
        </div>

        {/* Pin */}
        {isAdmin && (
          <div
            className="
              mb-1 flex h-11 items-center
              rounded-full border border-white/25 bg-white/[0.04]
              px-3 text-xs
            "
          >
            <input
              type="checkbox"
              id="pin"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="
                peer relative h-4 w-4 shrink-0 appearance-none
                rounded border border-white/70 bg-white/10
                backdrop-blur-[4px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)]
                transition-all
                checked:bg-white/25 checked:border-white checked:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]
                focus:outline-none focus-visible:ring-0
                after:pointer-events-none after:absolute after:left-[5px] after:top-[2px]
                after:h-[7px] after:w-[4px] after:rotate-45
                after:border-b-[1.5px] after:border-r-[1.5px] after:border-white
                after:opacity-0 checked:after:opacity-100
                after:content-['']
              "
            />
            <label
              htmlFor="pin"
              className="ml-2 flex items-center text-xs text-white/80"
            >
              <StarIcon className="mr-1 h-4 w-4" />
              Pin
            </label>
          </div>
        )}

        {/* Post button */}
        <button
          disabled={uploading}
          className="
            mb-1 w-full md:w-auto
            h-11 rounded-full border border-white/30
            bg-white/[0.18] px-5
            text-xs font-semibold text-white
            shadow-[inset_0_0_16px_rgba(255,255,255,0.26)]
            transition-all duration-200
            hover:bg-white/[0.25]
            active:scale-[0.97]
          "
        >
          {uploading ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
};

const EditAnnouncementModal = ({
  announcement,
  isAdmin,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(announcement.title);
  const [file, setFile] = useState(null);
  const [isPinned, setIsPinned] = useState(announcement.isPinned || false);
  const [editing, setEditing] = useState(false);

  const handleEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    if (file) formData.append('file', file);
    if (isAdmin) formData.append('isPinned', isPinned);

    setEditing(true);
    try {
      const { data } = await api.put(
        `/announcements/${announcement._id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onSuccess(data);
    } catch (err) {
      alert('Edit failed');
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="
          animate-glass
          w-full max-w-md rounded-2xl border border-white/25 bg-white/[0.06]
          px-5 py-5 text-sm text-white
          backdrop-blur-[12px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.2)]
        "
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Edit Announcement
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/30 bg-white/[0.02] p-1 text-white/70 hover:bg-white/[0.08]"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/70">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="
                w-full rounded-full border border-white/25 bg-white/[0.04]
                px-3 py-2 text-xs text-white
                outline-none backdrop-blur-[8px]
              "
            />
          </div>

          {isAdmin && (
            <div className="flex items-center rounded-full border border-white/25 bg-white/[0.04] px-3 py-1.5 text-xs">
              <input
                type="checkbox"
                id="edit-pin"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="
                    peer relative h-4 w-4 shrink-0 appearance-none
                    rounded border border-white/70 bg-white/10
                    backdrop-blur-[4px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)]
                    transition-all
                    checked:bg-white/25 checked:border-white checked:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]
                    focus:outline-none focus-visible:ring-0
                    after:pointer-events-none after:absolute after:left-[5px] after:top-[2px]
                    after:h-[7px] after:w-[4px] after:rotate-45
                    after:border-b-[1.5px] after:border-r-[1.5px] after:border-white
                    after:opacity-0 checked:after:opacity-100
                    after:content-['']
                  "
              />
              <label
                htmlFor="edit-pin"
                className="ml-2 text-xs text-white/80"
              >
                Pin this announcement
              </label>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.04] p-3 text-xs">
            <label
              className="
                flex cursor-pointer items-center justify-center rounded-full
                border border-white/30 bg-white/[0.1]
                px-4 py-2 text-xs font-medium
                shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
              "
            >
              <PaperClipIcon className="mr-2 h-4 w-4" />
              {file ? 'Change PDF' : 'Replace PDF'}
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-white/70">
                {file ? file.name : 'Current file will be kept'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing}
              className="
                rounded-full border border-white/30 bg-white/[0.2]
                px-5 py-2 text-xs font-semibold text-white
                shadow-[inset_0_0_18px_rgba(255,255,255,0.26)]
                hover:bg-white/[0.26]
                active:scale-[0.97]
              "
            >
              {editing ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
