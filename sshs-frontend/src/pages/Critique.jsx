import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';

/* ========================= */
/* GLASS SELECT COMPONENT */
/* ========================= */
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
          transition-all
        "
      >
        <span className="truncate text-left">{selected.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-white/80 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className="
            pointer-events-auto
      absolute left-0 z-[60] mt-2 w-full overflow-hidden
      rounded-2xl border border-white/25
      bg-black/[0.75] backdrop-blur-[14px]
      shadow-[inset_0_0_18px_rgba(255,255,255,0.22)]
          "
        >
          <ul className="max-h-56 overflow-y-auto py-1 text-xs text-white">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left transition-all ${
                    opt.value === value
                      ? 'bg-black/[0.45] font-semibold'
                      : 'hover:bg-black/[0.45]'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ========================= */
/* MAIN PAGE */
/* ========================= */
const Critique = () => {
  const { user } = useAuth();
  const [critiques, setCritiques] = useState([]);
  const [classes, setClasses] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    fetchCritiques();
    if (user.role === 'admin') fetchClasses();
  }, [user]);

  const fetchCritiques = async () => {
    const endpoint =
      user.role === 'admin'
        ? '/behavior/critique/all'
        : '/behavior/critique/my';
    const { data } = await api.get(endpoint);
    setCritiques(data);
  };

  const fetchClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
  };

  const handleCreate = async (formData) => {
    await api.post('/behavior/critique', formData);
    fetchCritiques();
  };

  const filteredCritiques = critiques.filter((c) => {
    const searchMatch =
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const gradeMatch = selectedGrade
      ? c.class?.gradeLevel?.toString() === selectedGrade
      : true;

    const classMatch = selectedClass
      ? c.class?._id === selectedClass
      : true;

    return searchMatch && gradeMatch && classMatch;
  });

  const dropdownClasses = selectedGrade
    ? classes.filter((c) => c.gradeLevel?.toString() === selectedGrade)
    : classes;

  return (
    <div className="container mx-auto pb-10">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Critique & Suggestions
      </h2>

      {user.role === 'student' && (
        <CritiqueForm onSubmit={handleCreate} user={user} />
      )}

      {/* ADMIN FILTERS */}
      {user.role === 'admin' && (
        <div className="relative z-30 mb-6 flex flex-col gap-4
      rounded-2xl border border-white/15 bg-white/[0.04]
      p-4 backdrop-blur-[10px] md:flex-row">
          <div className="relative w-full flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-3.5 h-4 w-4 text-white/70" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search critiques..."
              className="
                h-11 w-full rounded-full border border-white/25
                bg-white/[0.04] pl-10 pr-4 text-xs text-white
                backdrop-blur-[10px]
                shadow-[inset_0_0_10px_rgba(255,255,255,0.18)]
                outline-none
              "
            />
          </div>

          <GlassSelect
            value={selectedGrade}
            onChange={(v) => {
              setSelectedGrade(v);
              setSelectedClass('');
            }}
            placeholder="All Grades"
            options={[
              { label: 'All Grades', value: '' },
              { label: 'Grade 10', value: '10' },
              { label: 'Grade 11', value: '11' },
              { label: 'Grade 12', value: '12' },
            ]}
            className="w-full md:w-[160px]"
          />

          <GlassSelect
            value={selectedClass}
            onChange={setSelectedClass}
            placeholder="All Classes"
            options={[
              { label: 'All Classes', value: '' },
              ...dropdownClasses.map((c) => ({
                label: c.name,
                value: c._id,
              })),
            ]}
            className="w-full md:w-[220px]"
          />
        </div>
      )}

      {/* LIST */}
      <div className="relative z-10 overflow-hidden
    rounded-2xl border border-white/15
    bg-white/[0.04] backdrop-blur-[10px] shadow">
        <h2 className="border-b border-white/10 p-6 text-xl font-bold text-white">
          {user.role === 'student'
            ? 'My Feedback History'
            : `Student Feedback (${filteredCritiques.length})`}
        </h2>

        <div className="divide-y divide-white/10">
          {filteredCritiques.map((c) => (
            <div key={c._id} className="p-6">
              <div className="mb-2 flex justify-between text-xs text-white/70">
                <div className="flex gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-0.5">
                    {c.class?.name}
                  </span>
                  {user.role === 'admin' && (
                    <span className="rounded-full bg-white/10 px-3 py-0.5">
                      Grade {c.class?.gradeLevel}
                    </span>
                  )}
                </div>
                <span>
                  {new Date(c.createdAt).toLocaleDateString('en-CA')}
                </span>
              </div>

              {user.role === 'admin' && (
                <div className="mb-1 text-xs text-white/70">
                  Student: {c.student?.name}
                </div>
              )}

              <p className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-white italic">
                "{c.message}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ========================= */
/* STUDENT FORM */
/* ========================= */
const CritiqueForm = ({ onSubmit, user }) => {
  const [message, setMessage] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);

  const location = useLocation();

  useEffect(() => {
    api.get('/classes').then((res) => {
      const myClasses = res.data.filter((c) =>
        c.students.some((s) => s === user._id || s._id === user._id)
      );
      setClasses(myClasses);

      if (location.state?.preSelectClassId) {
        setClassId(location.state.preSelectClassId);
      }
    });
  }, [user, location.state]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!classId || !message) return;

    onSubmit({ classId, message });
    setMessage('');
    setClassId('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-2xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-[10px] shadow"
    >
      <label className="mb-1 block text-xs text-white/70">Select Class</label>

      <GlassSelect
        value={classId}
        onChange={setClassId}
        placeholder="Choose Subject"
        options={classes.map((c) => ({
          label: c.name,
          value: c._id,
        }))}
        className="mb-4"
      />

      <label className="mb-1 block text-xs text-white/70">
        Your Suggestion / Critique
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="
          h-28 w-full rounded-2xl border border-white/20
          bg-white/10 p-4 text-xs text-white
          backdrop-blur-[10px] outline-none
        "
      />

      <button
        className="
          mt-4 h-11 w-full rounded-full border border-white/25
          bg-white/20 text-sm font-semibold text-white
          shadow-[inset_0_0_16px_rgba(255,255,255,0.28)]
          transition hover:bg-white/30
        "
      >
        Send Feedback
      </button>
    </form>
  );
};

export default Critique;
