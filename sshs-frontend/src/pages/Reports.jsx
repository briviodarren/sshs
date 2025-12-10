import React, { useState } from 'react';
import api from '../services/api';
import {
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ChatBubbleBottomCenterTextIcon,
  MegaphoneIcon,
  ClockIcon,
  ShieldExclamationIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

const REPORTS = [
  { id: 'student_performance', label: 'Student Report Cards', desc: 'GPA & Grades', icon: AcademicCapIcon },
  { id: 'at_risk', label: 'At-Risk Students', desc: 'Low GPA / High Penalty', icon: ExclamationTriangleIcon },
  { id: 'attendance', label: 'Attendance Register', desc: 'Presence logs per class', icon: ClockIcon },
  { id: 'assignments', label: 'Assignment Tracker', desc: 'Submission rates', icon: ClipboardDocumentCheckIcon },
  { id: 'teacher_activity', label: 'Teacher Activity', desc: 'Uploads & Engagement', icon: UserGroupIcon },
  { id: 'enrollment', label: 'Course Enrollment', desc: 'Class density & stats', icon: BuildingLibraryIcon },
  { id: 'finance', label: 'Financial Aid', desc: 'Scholarships & Relief', icon: BanknotesIcon },
  { id: 'disciplinary', label: 'Disciplinary Cases', desc: 'Penalties & Violations', icon: ShieldExclamationIcon },
  { id: 'critique', label: 'Student Feedback', desc: 'Critiques & Suggestions', icon: ChatBubbleBottomCenterTextIcon },
  { id: 'announcements', label: 'Announcement Reach', desc: 'View counts & Engagement', icon: MegaphoneIcon },
];

const Reports = () => {
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [loading, setLoading] = useState(null);
  const [resetting, setResetting] = useState(false);

  const handleDownload = async (reportId) => {
    if (!academicYear) return alert('Enter Academic Year');
    setLoading(reportId);
    try {
      const response = await api.post(
        '/admin/reports',
        { type: reportId, academicYear },
        { responseType: 'blob' },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportId}_${academicYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        '⚠️ DANGER: This will delete ALL data (Students, Classes, Grades, etc). Only Admin accounts remain. Are you sure?',
      )
    )
      return;
    if (!window.confirm('Final Confirmation: This action cannot be undone.'))
      return;

    setResetting(true);
    try {
      await api.delete('/admin/reset-year');
      alert('System Reset Successful.');
      window.location.reload();
    } catch (e) {
      alert('Reset Failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-10">
      {/* HEADER */}
      <div
        className="
          mb-6 rounded-[1.75rem]
          border border-white/25
          bg-white/[0.04]
          px-6 py-6
          backdrop-blur-[14px]
          shadow-[inset_0_0_24px_rgba(255,255,255,0.2)]
        "
      >
        <h1 className="mb-2 text-2xl font-semibold text-white">
          Reports
        </h1>
        <p className="text-sm text-white/70">
          Generate CSV reports & control academic data lifecycle.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs text-white/70">Academic Year :</span>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="
              h-11 w-36 rounded-full
              border border-white/25
              bg-white/[0.06]
              px-4 text-center text-xs text-white
              outline-none
              backdrop-blur-[8px]
              shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]
              focus:ring-2 focus:ring-white/40
            "
          />
        </div>
      </div>

      {/* REPORT GRID */}
      <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="
              flex flex-col justify-between
              rounded-[1.5rem]
              border border-white/20
              bg-white/[0.04]
              p-5
              backdrop-blur-[12px]
              shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]
              transition
              hover:bg-white/[0.08]
            "
          >
            <div>
              <div className="mb-2 flex items-center gap-3">
                <r.icon className="h-6 w-6 text-white/90" />
                <h3 className="text-base font-semibold text-white">
                  {r.label}
                </h3>
              </div>
              <p className="text-xs text-white/60">{r.desc}</p>
            </div>

            <button
              onClick={() => handleDownload(r.id)}
              disabled={loading === r.id}
              className="
                mt-4 flex h-11 w-full items-center justify-center gap-2
                rounded-full border border-white/30
                bg-white/[0.26]
                text-xs font-semibold text-white
                shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]
                hover:bg-white/[0.36]
                disabled:opacity-50
              "
            >
              {loading === r.id ? (
                'Generating...'
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download CSV
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* DANGER ZONE */}
      <div
        className="
          rounded-[1.75rem]
          border border-white/30
          bg-white/[0.04]
          px-6 py-6
          backdrop-blur-[14px]
          shadow-[inset_0_0_24px_rgba(255,255,255,0.2)]
        "
      >
        <h2 className="mb-3 flex items-center text-lg font-semibold text-white">
          <ExclamationTriangleIcon className="mr-2 h-6 w-6" />
          System Reset – New Academic Year
        </h2>

        <p className="mb-6 max-w-2xl text-xs text-white/70">
          This will permanently remove all Students, Teachers, Classes,
          Assignments, Attendance, Grades, and Reports. Only Admin accounts are
          preserved. This action cannot be undone.
        </p>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="
            flex h-11 items-center gap-2
            rounded-full border border-white/40
            bg-white/[0.26]
            px-6 text-xs font-semibold text-white
            shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]
            hover:bg-white/[0.38]
            disabled:opacity-50
          "
        >
          {resetting ? (
            'Resetting System...'
          ) : (
            <>
              <ArrowPathIcon className="h-5 w-5" />
              Start New Academic Year
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Reports;
