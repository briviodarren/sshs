import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  AcademicCapIcon,
  LockClosedIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

/* ----------------- GlassSelect (same style as Assignments/Materials) ----------------- */
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

/* ----------------- MAIN SCORES COMPONENT ----------------- */

const Scores = () => {
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
        <h1 className="text-2xl font-semibold text-white">Scores</h1>

        {user.role === 'student' ? (
          <StudentScoresView />
        ) : (
          <TeacherScorebookView user={user} />
        )}
      </div>
    </div>
  );
};

/* ----------------- STUDENT VIEW (With Critique Unlock Logic) ----------------- */

const StudentScoresView = () => {
  const [scoreCards, setScoreCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const { data } = await api.get('/scores/my-scores');
        setScoreCards(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  // Check if ALL classes have been critiqued (to unlock GPA)
  const allCritiquesDone = scoreCards.every((card) => card.hasCritiqued);

  const calculateTotalAverage = () => {
    if (!allCritiquesDone) return '???'; // Hide if locked

    let totalValue = 0;
    let count = 0;
    scoreCards.forEach((card) => {
      Object.values(card.scores).forEach((val) => {
        totalValue += val;
        count++;
      });
    });
    return count === 0 ? 0 : (totalValue / count).toFixed(1);
  };

  const handleUnlock = (classId) => {
    // Navigate to Critique page with the classId pre-selected
    navigate('/critique', { state: { preSelectClassId: classId } });
  };

  if (loading)
    return (
      <div className="mt-8 text-center text-white/80">
        Loading scores...
      </div>
    );

  return (
    <div className="mt-4 space-y-6">
      {/* GPA Dashboard – glass card */}
      <div
        className={`
          flex flex-col gap-4
          rounded-2xl border border-white/25
          bg-white/[0.04] px-5 py-4
          backdrop-blur-[10px]
          shadow-[inset_0_0_18px_rgba(255,255,255,0.18)]
          transition-all
          sm:flex-row sm:items-center sm:justify-between
          ${!allCritiquesDone ? 'grayscale opacity-80' : ''}
        `}
      >
        <div className="flex flex-1 items-start gap-3">
          <div
            className="
              flex h-11 w-11 items-center justify-center
              rounded-full border border-white/30
              bg-white/[0.10]
              shadow-[inset_0_0_14px_rgba(255,255,255,0.24)]
              backdrop-blur-[10px]
            "
          >
            <AcademicCapIcon className="h-5 w-5 text-white/90" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Academic Performance
            </h2>
            <p className="text-xs text-white/70">
              {allCritiquesDone
                ? 'Overall average score'
                : 'Complete all critiques to view GPA'}
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right sm:min-w-[120px]">
          <span className="flex items-center justify-center gap-2 text-3xl font-bold text-white sm:justify-end">
            {calculateTotalAverage()}
            {!allCritiquesDone && (
              <LockClosedIcon className="h-5 w-5 text-white/70" />
            )}
          </span>
          <span className="block text-xs text-white/70">/ 100</span>
        </div>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scoreCards.length === 0 && (
          <p className="text-sm text-white/60">No scores recorded yet.</p>
        )}

        {scoreCards.map((card, index) => {
          const vals = Object.values(card.scores);
          const avg = vals.length
            ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(0)
            : 'N/A';

          return (
            <div
              key={index}
              className="
                flex flex-col rounded-2xl border border-white/20
                bg-white/[0.03]
                shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
                overflow-hidden
              "
            >
              <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.04] px-4 py-3">
                <h3 className="text-sm font-semibold text-white">
                  {card.className}
                </h3>
                <span
                  className={`
                    text-xs font-semibold px-2 py-1 rounded-full
                    ${
                      card.hasCritiqued
                        ? Number(avg) >= 75
                          ? 'bg-green-500/25 text-green-100 border border-green-400/60'
                          : 'bg-orange-400/20 text-orange-100 border border-orange-300/70'
                        : 'bg-white/[0.06] text-white/50 border border-white/20'
                    }
                  `}
                >
                  Avg: {card.hasCritiqued ? avg : '?'}
                </span>
              </div>

              <div className="space-y-3 px-4 py-3">
                <ScoreRow label="Assignment" value={card.scores['Assignment']} />
                <ScoreRow label="Midterm" value={card.scores['Midterm']} />

                {/* FINAL SCORE (Locked Logic) */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Final</span>
                  {card.hasCritiqued ? (
                    <span
                      className={`text-sm font-medium ${
                        card.scores['Final'] ? 'text-white' : 'text-white/40'
                      }`}
                    >
                      {card.scores['Final'] !== undefined
                        ? card.scores['Final']
                        : '-'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleUnlock(card.classId)}
                      className="
                        h-9 inline-flex items-center gap-2
                        rounded-full border border-white/30
                        bg-white/[0.12] px-4
                        text-xs text-white
                        hover:bg-white/[0.18]
                      "
                    >
                      <LockClosedIcon className="h-3 w-3" /> Unlock
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ScoreRow = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-white/60">{label}</span>
    <span
      className={`text-sm font-medium ${
        value !== undefined ? 'text-white' : 'text-white/35'
      }`}
    >
      {value !== undefined ? value : '-'}
    </span>
  </div>
);

/* ----------------- TEACHER / ADMIN VIEW (With Grade Filter) ----------------- */

const TeacherScorebookView = ({ user }) => {
  const [classes, setClasses] = useState([]);

  // FILTERS
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [scorebook, setScorebook] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);

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

  useEffect(() => {
    if (!selectedClass) return;
    const fetchScorebook = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/scores/class/${selectedClass}`);
        setScorebook(data);
      } catch (e) {
        alert('Failed to load scores');
      } finally {
        setLoading(false);
      }
    };
    fetchScorebook();
  }, [selectedClass]);

  const handleSaveScore = async (value) => {
    try {
      await api.post('/scores', {
        studentId: editingScore.studentId,
        classId: selectedClass,
        type: editingScore.type,
        value: Number(value),
      });

      setScorebook(
        scorebook.map((entry) => {
          if (entry.student._id === editingScore.studentId) {
            return {
              ...entry,
              scores: { ...entry.scores, [editingScore.type]: Number(value) },
            };
          }
          return entry;
        })
      );
      setEditingScore(null);
    } catch (e) {
      alert('Failed to save score');
    }
  };

  // --- FILTER LOGIC ---
  const filteredClasses = selectedGrade
    ? classes.filter((c) => c.gradeLevel?.toString() === selectedGrade)
    : classes;

  return (
    <div className="mt-4 space-y-6">
      {/* FILTER BAR – glass pill container */}
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
        <div className="flex flex-col gap-4 md:flex-row">
          {/* 1. Grade Dropdown */}
          <div className="flex-1">
            <GlassSelect
              value={selectedGrade}
              onChange={(v) => {
                setSelectedGrade(v);
                setSelectedClass('');
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

          {/* 2. Class Dropdown (Filtered) */}
          <div className="flex-[2]">
            <GlassSelect
              value={selectedClass}
              onChange={setSelectedClass}
              options={[
                { value: '', label: 'Choose Class' },
                ...filteredClasses.map((c) => ({
                  value: c._id,
                  label: c.name,
                })),
              ]}
              placeholder="-- Choose Class --"
            />
          </div>
        </div>
      </div>

      {selectedClass && (
        <div
          className="
            rounded-2xl border border-white/20 bg-white/[0.03]
            shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
            overflow-hidden
          "
        >
          <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.04] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Scorebook</h3>
            {loading && (
              <span className="text-[11px] text-white/60">Loading…</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm text-white/80">
              <thead className="bg-white/[0.02] text-[11px] uppercase text-white/60">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3 text-center">Assignment</th>
                  <th className="px-6 py-3 text-center">Midterm</th>
                  <th className="px-6 py-3 text-center">Final</th>
                  <th className="px-6 py-3 text-center">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {scorebook.map((entry) => {
                  const vals = Object.values(entry.scores);
                  const avg = vals.length
                    ? (
                        vals.reduce((a, b) => a + b, 0) / vals.length
                      ).toFixed(1)
                    : '-';
                  return (
                    <tr
                      key={entry.student._id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-3 font-medium text-white">
                        {entry.student.name}
                      </td>
                      {['Assignment', 'Midterm', 'Final'].map((type) => (
                        <td key={type} className="px-6 py-3 text-center">
                          <ScoreCell
                            value={entry.scores[type]}
                            onEdit={() =>
                              setEditingScore({
                                studentId: entry.student._id,
                                studentName: entry.student.name,
                                type,
                                currentValue: entry.scores[type],
                              })
                            }
                          />
                        </td>
                      ))}
                      <td className="px-6 py-3 text-center text-sm font-bold text-blue-100">
                        {avg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingScore && (
        <EditScoreModal
          data={editingScore}
          onClose={() => setEditingScore(null)}
          onSave={handleSaveScore}
        />
      )}
    </div>
  );
};

const ScoreCell = ({ value, onEdit }) => (
  <button
    type="button"
    onClick={onEdit}
    className={`
      inline-flex h-9 min-w-[3.5rem] items-center justify-center
      rounded-full border
      px-3 text-xs font-medium
      transition
      ${
        value !== undefined
          ? 'border-white/30 bg-white/[0.12] text-white hover:bg-white/[0.2]'
          : 'border-white/15 bg-white/[0.03] text-white/35 hover:bg-white/[0.08]'
      }
    `}
  >
    {value !== undefined ? value : '-'}
  </button>
);

/* ----------------- Edit Score Modal ----------------- */

const EditScoreModal = ({ data, onClose, onSave }) => {
  const [val, setVal] = useState(data.currentValue || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (val === '' || val < 0 || val > 100)
      return alert('Enter valid score (0-100)');
    onSave(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="
          w-full max-w-xs
          rounded-2xl border border-white/25
          bg-white/[0.06] px-5 py-5
          backdrop-blur-[12px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.2)]
        "
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Input Score
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/30 bg-white/[0.02] px-2 py-1 text-xs text-white/70 hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>
        <p className="mb-4 text-xs text-white/70">
          {data.studentName} –{' '}
          <span className="font-medium text-white">{data.type}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            min="0"
            max="100"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="
              w-full h-11 rounded-full
              border border-white/30 bg-white/[0.04]
              px-4 text-center text-lg font-bold text-white
              outline-none backdrop-blur-[8px]
            "
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full px-4 text-xs text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                h-11 rounded-full border border-white/30 bg-white/[0.2]
                px-5 text-xs font-semibold text-white
                shadow-[inset_0_0_18px_rgba(255,255,255,0.26)]
                hover:bg-white/[0.26]
                active:scale-[0.97]
              "
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Scores;
