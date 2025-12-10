import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/* ----------------- Helpers ----------------- */

// Helper to get Day Name (e.g., "Monday")
const getDayName = (date) => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getDay()];
};

// Glass dropdown (same style as Assignments / Materials)
const GlassSelect = ({
  value,
  onChange,
  options = [],
  className = '',
  placeholder,
}) => {
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

/* ----------------- MAIN COMPONENT ----------------- */

const Attendance = () => {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl pb-10 px-3 sm:px-4">
      <div
        className="
          animate-glass
          rounded-[1.75rem]
          border border-white/25
          bg-white/[0.03]
          px-5 py-5
          backdrop-blur-[10px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
        "
      >
        <h1 className="text-2xl font-semibold text-white">Attendance</h1>
        {user.role === 'student' ? (
          <StudentAttendanceView />
        ) : (
          <TeacherAttendanceView user={user} />
        )}
      </div>
    </div>
  );
};

/* ----------------- STUDENT VIEW ----------------- */

const StudentAttendanceView = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/attendance/my-stats').then((res) => setStats(res.data));
  }, []);

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.keys(stats).length === 0 && (
        <p className="text-sm text-white/60">No attendance records found.</p>
      )}

      {Object.entries(stats).map(([className, data]) => (
        <AttendanceCard key={className} className={className} data={data} />
      ))}
    </div>
  );
};

const AttendanceCard = ({ className, data }) => {
  const [showHistory, setShowHistory] = useState(false);
  const percentage =
    data.total === 0
      ? 100
      : Math.round(((data.present + data.excused) / data.total) * 100);
  const isDanger = percentage < 70;

  return (
    <div
      className={`
        rounded-2xl border
        bg-white/[0.03]
        shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
        transition-all
        ${
          isDanger
            ? 'border-white-400/70 shadow-[inset_0_0_18px_rgba(255,255,255,0.35)]'
            : 'border-white/20'
        }
      `}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="w-2/3 truncate text-sm font-semibold text-white">
            {className}
          </h3>
          <div
            className={`text-3xl font-bold ${
              isDanger ? 'text-white-300' : 'text-white-200'
            }`}
          >
            {percentage}%
          </div>
        </div>

        {isDanger && (
          <div
            className="
              mb-4 flex items-start gap-2 rounded-2xl border border-white-400/40
              bg-white-500/15 p-3 text-xs text-white-100
            "
          >
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Attendance below 70%. Not eligible for finals.</p>
          </div>
        )}

        <div className="mb-4 space-y-1 text-xs text-white/70">
          <div className="flex justify-between">
            <span>Present</span>
            <span className="font-semibold text-white-200">
              {data.present}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Late</span>
            <span className="font-semibold text-white-200">
              {data.late}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Excused</span>
            <span className="font-semibold text-white-200">
              {data.excused}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Absent</span>
            <span className="font-semibold text-white-200">
              {data.absent}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="
            flex h-11 w-full items-center justify-center gap-1
            rounded-full border border-white/25 bg-white/[0.06]
            text-xs font-medium text-white
            backdrop-blur-[8px]
            shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]
            hover:bg-white/[0.12]
            transition-colors
          "
        >
          {showHistory ? 'Hide History' : 'View History'}
          {showHistory ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {showHistory && (
        <div className="max-h-60 overflow-y-auto rounded-b-2xl border-t border-white/15 bg-white/[0.03]">
          <div className="sticky top-0 flex justify-between bg-white/[0.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/60">
            <span>Date</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-white/10">
            {data.history.map((record, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between px-4 py-3 text-xs hover:bg-white/[0.04] transition-colors"
              >
                <span className="font-medium text-white/85">
                  {new Date(record.date).toLocaleDateString('en-CA')}
                </span>
                <span
                  className={`
                    min-w-[80px] rounded-full px-2 py-1 text-center text-[10px] font-semibold uppercase
                    ${getStatusTextColor(record.status)}
                  `}
                >
                  {record.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ----------------- TEACHER VIEW ----------------- */

const TeacherAttendanceView = ({ user }) => {
  const [classes, setClasses] = useState([]);

  // FILTER STATES
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await api.get('/classes');
      if (user.role === 'teacher') {
        setClasses(
          data.filter(
            (c) => c.teacher?._id === user._id || c.teacher === user._id
          )
        );
      } else {
        setClasses(data);
      }
    };
    fetchClasses();
  }, [user]);

  // Load Students when Class or Date changes
  useEffect(() => {
    if (!selectedClass) return;
    const loadList = async () => {
      setLoading(true);
      try {
        const cls = classes.find((c) => c._id === selectedClass);
        if (!cls) return;

        // TIMEZONE FIX: Calculate local YYYY-MM-DD string
        const offset = selectedDate.getTimezoneOffset();
        const localDate = new Date(selectedDate.getTime() - offset * 60 * 1000);
        const dateString = localDate.toISOString().split('T')[0];

        const { data: existingRecords } = await api.get(
          `/attendance/class/${selectedClass}/${dateString}`
        );

        const merged = cls.students.map((s) => {
          const record = existingRecords.find((r) => r.student === s._id);
          return {
            studentId: s._id,
            name: s.name,
            status: record ? record.status : 'Present',
          };
        });
        setStudents(merged);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, [selectedClass, selectedDate, classes]);

  const handleStatusChange = (studentId, status) => {
    setStudents(
      students.map((s) =>
        s.studentId === studentId ? { ...s, status } : s
      )
    );
  };

  const handleSave = async () => {
    try {
      const offset = selectedDate.getTimezoneOffset();
      const localDate = new Date(selectedDate.getTime() - offset * 60 * 1000);
      const dateString = localDate.toISOString().split('T')[0];

      await api.post('/attendance', {
        classId: selectedClass,
        date: dateString,
        students: students.map((s) => ({
          studentId: s.studentId,
          status: s.status,
        })),
      });
      alert('Attendance Saved!');
    } catch (e) {
      alert('Failed to save');
    }
  };

  const currentDayName = getDayName(selectedDate);

  const filteredClasses = classes.filter((c) => {
    const matchesGrade = selectedGrade
      ? c.gradeLevel?.toString() === selectedGrade
      : false;
    const matchesDay = c.day === currentDayName;
    return matchesGrade && matchesDay;
  });

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-5 space-y-6">
      {/* Filters Bar – glass pill container */}
      <div
        className="
          rounded-[1.75rem]
          border border-white/18
          bg-white/[0.02]
          px-4 py-4
          backdrop-blur-[8px]
          shadow-[inset_0_0_16px_rgba(255,255,255,0.16)]
        "
      >
        <div className="flex flex-col items-center gap-4 md:flex-row">
          {/* Date Picker */}
          <div className="w-full md:w-56">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedClass('');
              }}
              className="
                h-11 w-full rounded-full border border-white/25
                bg-white/[0.04] px-4 text-xs text-white
                outline-none backdrop-blur-[6px]
              "
            />
          </div>

          {/* Grade Dropdown */}
          <div className="w-full md:w-40">
            <GlassSelect
              value={selectedGrade}
              onChange={(v) => {
                setSelectedGrade(v);
                setSelectedClass('');
              }}
              options={[
                { value: '', label: 'Select Grade' },
                { value: '10', label: 'Grade 10' },
                { value: '11', label: 'Grade 11' },
                { value: '12', label: 'Grade 12' },
              ]}
              placeholder="-- Select Grade --"
            />
          </div>

          {/* Class Dropdown */}
          <div className="w-full flex-1">
            <GlassSelect
              value={selectedClass}
              onChange={setSelectedClass}
              options={[
                {
                  value: '',
                  label: !selectedGrade
                    ? 'Select a Grade first'
                    : filteredClasses.length === 0
                    ? `No classes on ${currentDayName}`
                    : 'Select Class',
                },
                ...filteredClasses.map((c) => ({
                  value: c._id,
                  label: c.name,
                })),
              ]}
              placeholder={
                !selectedGrade
                  ? 'Select a Grade first'
                  : filteredClasses.length === 0
                  ? `No classes on ${currentDayName}`
                  : 'Select Class'
              }
            />
          </div>
        </div>
      </div>

      {selectedClass && (
        <div
          className="
            overflow-hidden rounded-2xl border border-white/20
            bg-white/[0.03]
            shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
          "
        >
          <div className="flex flex-col gap-3 border-b border-white/15 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="text-sm font-semibold text-white">
                Student List
              </h3>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                className="
                  h-9 w-full rounded-full border border-white/25
                  bg-white/[0.04] px-3 text-xs text-white
                  placeholder:text-white/40
                  outline-none backdrop-blur-[6px]
                  focus:ring-1 focus:ring-white/40
                  sm:w-48
                "
              />
            </div>
            <button
              onClick={handleSave}
              className="
                h-10 w-full inline-flex items-center justify-center gap-2
                rounded-full border border-white/30
                bg-white/[0.12] px-4
                text-sm text-white
                hover:bg-white/[0.18]
                sm:h-11 sm:w-auto
              "
            >
              Save Attendance
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm text-white/80">
              <thead className="bg-white/[0.02] text-[11px] uppercase text-white/60">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.studentId}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-3 font-medium text-white">
                      {s.name}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap justify-start gap-2 sm:justify-center">
                        {['Present', 'Absent', 'Late', 'Excused'].map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusChange(s.studentId, status)
                              }
                              className={`
                                h-9 rounded-full px-3 text-[11px] font-semibold
                                transition
                                ${
                                  s.status === status
                                    ? `${getStatusBgColor(
                                        status
                                      )} text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.45)] `
                                    : 'border border-white/20 bg-white/[0.04] text-white/70 hover:bg-white/[0.1]'
                                }
                              `}
                            >
                              {status}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-4 text-center text-xs text-white/60"
                    >
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ----------------- COLOR HELPERS ----------------- */

// Helper for Button Backgrounds (Teacher View)
const getStatusBgColor = (status) => {
  switch (status) {
    case 'Present':
      return 'bg-white-500';
    case 'Absent':
      return 'bg-white-500';
    case 'Late':
      return 'bg-white-500';
    case 'Excused':
      return 'bg-white-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper for Text Colors (Student History View)
const getStatusTextColor = (status) => {
  switch (status) {
    case 'Present':
      return 'bg-white-900/70 text-white-100 border border-white-400/40';
    case 'Absent':
      return 'bg-white-900/70 text-white-100 border border-white-400/40';
    case 'Late':
      return 'bg-white-900/70 text-white-100 border border-white-400/40';
    case 'Excused':
      return 'bg-white-900/70 text-white-100 border border-white-400/40';
    default:
      return 'bg-white/[0.06] text-white/70 border border-white/20';
  }
};

export default Attendance;
