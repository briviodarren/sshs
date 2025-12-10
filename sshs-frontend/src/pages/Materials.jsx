import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ArrowUpTrayIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PaperClipIcon,
  UserGroupIcon,
  XMarkIcon,
  ChevronDownIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

/* ----------------- GlassSelect (same style as Assignments) ----------------- */
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

/* ----------------- Main Materials Component ----------------- */

const Materials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState('');

  // Modals
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isViewersModalOpen, setIsViewersModalOpen] = useState(false);
  const [selectedViewers, setSelectedViewers] = useState([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: materialsData } = await api.get('/materials');
      setMaterials(materialsData);

      const { data: allClasses } = await api.get('/classes');

      if (user.role === 'admin') {
        setClasses(allClasses);
      } else if (user.role === 'teacher') {
        setClasses(
          allClasses.filter(
            (c) => c.teacher?._id === user._id || c.teacher === user._id
          )
        );
      } else if (user.role === 'student') {
        setClasses(
          allClasses.filter((c) =>
            c.students.some((s) => s._id === user._id || s === user._id)
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleUpload = async (formData) => {
    try {
      const { data } = await api.post('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaterials([data, ...materials]);
      alert('Material Uploaded!');
    } catch (e) {
      alert(e.response?.data?.message || 'Upload failed');
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      const { data } = await api.put(`/materials/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaterials(materials.map((m) => (m._id === id ? data : m)));
      setEditingMaterial(null);
      alert('Material Updated!');
    } catch (e) {
      alert('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this material?')) {
      try {
        await api.delete(`/materials/${id}`);
        setMaterials(materials.filter((m) => m._id !== id));
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const handleView = async (id) => {
    try {
      await api.put(`/materials/${id}/view`);
    } catch (err) {
      // ignore
    }
  };

  const handleShowViewers = (viewers) => {
    setSelectedViewers(viewers);
    setIsViewersModalOpen(true);
  };

  // --- Dependent dropdown ---

  const filteredClassesForDropdown = selectedGradeFilter
    ? classes.filter((c) => c.gradeLevel.toString() === selectedGradeFilter)
    : classes;

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassFilter
      ? m.class?._id === selectedClassFilter
      : true;
    const matchesWeek = selectedWeekFilter
      ? m.week?.toString() === selectedWeekFilter
      : true;
    const matchesGrade = selectedGradeFilter
      ? m.class?.gradeLevel?.toString() === selectedGradeFilter
      : true;
    return matchesSearch && matchesClass && matchesWeek && matchesGrade;
  });

  return (
    <div className="mx-auto max-w-4xl pb-10 px-3 sm:px-4">
      {/* Main glass card (like Assignments) */}
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
        <h1 className="text-2xl font-semibold text-white">Materials</h1>

        {user.role === 'teacher' && (
          <UploadMaterialForm classes={classes} onUpload={handleUpload} />
        )}

        {/* Filters bar – glass pill, same rhythm as Assignments */}
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
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative w-full flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search materials..."
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

            {/* Week filter */}
            <div className="w-full md:w-40">
              <GlassSelect
                value={selectedWeekFilter}
                onChange={setSelectedWeekFilter}
                options={[
                  { value: '', label: 'All Weeks' },
                  ...Array.from({ length: 14 }, (_, i) => i + 1).map((w) => ({
                    value: String(w),
                    label: `Week ${w}`,
                  })),
                ]}
                placeholder="All Weeks"
              />
            </div>
          </div>
        </div>

        {/* Materials list */}
        <div className="grid gap-4">
          {filteredMaterials.length === 0 && (
            <p className="text-center text-white/60">
              No materials found.
            </p>
          )}

          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material._id}
              material={material}
              user={user}
              onDelete={() => handleDelete(material._id)}
              onDownload={() => handleView(material._id)}
              onEdit={() => setEditingMaterial(material)}
              onShowViewers={() => handleShowViewers(material.views)}
            />
          ))}
        </div>
      </div>

      {editingMaterial && (
        <EditMaterialModal
          material={editingMaterial}
          classes={classes}
          onUpdate={handleUpdate}
          onClose={() => setEditingMaterial(null)}
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

/* ----------------- Upload Material Form ----------------- */

const UploadMaterialForm = ({ classes, onUpload }) => {
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [week, setWeek] = useState('1');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formGrade, setFormGrade] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file || !classId) return alert('All fields required');

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('classId', classId);
    formData.append('week', week);
    formData.append('file', file);

    await onUpload(formData);
    setTitle('');
    setFile(null);
    setClassId('');
    setWeek('1');
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
        relative z-10
        mb-4 rounded-2xl border border-white/20
        bg-white/[0.02] p-5
        backdrop-blur-[8px]
        shadow-[inset_0_0_18px_rgba(255,255,255,0.16)]
      "
    >
      <h2 className="mb-3 text-sm font-semibold text-white">
        Upload New Material
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

        {/* Grade */}
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

        {/* Class */}
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

        {/* Week */}
        <GlassSelect
          value={week}
          onChange={setWeek}
          options={Array.from({ length: 14 }, (_, i) => i + 1).map((w) => ({
            value: String(w),
            label: `Week ${w}`,
          }))}
          placeholder="Select Week"
        />
      </div>

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
            {file ? 'Change File' : 'Attach File'}
            <input
              type="file"
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
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
};

/* ----------------- Material Card ----------------- */

const MaterialCard = ({
  material,
  user,
  onDelete,
  onDownload,
  onEdit,
  onShowViewers,
}) => {
  const isOwner =
    material.uploadedBy?._id === user._id || material.uploadedBy === user._id;
  const canEdit = user.role === 'admin' || (user.role === 'teacher' && isOwner);

  return (
    <div
      className="
        flex flex-col gap-4
        rounded-2xl border border-white/20
        bg-white/[0.03] p-5
        shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]
        md:flex-row md:items-center md:justify-between
      "
    >
      <div className="flex items-start gap-4">
        <div
          className="
            flex h-11 w-11 flex-shrink-0 items-center justify-center
            rounded-full border border-white/30
            bg-white/[0.10]
            shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
            backdrop-blur-[8px]
          "
        >
          <CubeIcon className="h-6 w-6 text-white/85" />
        </div>

        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {material.title}
            </h3>
            <span className="rounded-full border border-white/18 bg-white/[0.06] px-2 py-0.5 text-xs text-white/90">
              Grade {material.class?.gradeLevel || '?'} •{' '}
              {material.class?.name || 'Unknown'}
            </span>
            <span className="rounded-full border border-white/18 bg-white/[0.08] px-2 py-0.5 text-xs text-white/90">
              Week {material.week}
            </span>
          </div>
          <p className="text-sm text-white/70">
            Uploaded by: {material.uploadedBy?.name || 'Unknown'}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 md:mt-0 md:justify-end">
        {/* Views (teacher/admin only) */}
        {(user.role === 'teacher' || user.role === 'admin') && (
          <button
            onClick={onShowViewers}
            className="
              inline-flex h-11 items-center gap-2
              rounded-full border border-white/30
              bg-white/[0.12] px-4
              text-xs font-semibold text-white
              shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
              hover:bg-white/[0.2]
              transition
            "
          >
            <EyeIcon className="h-4 w-4" />
            {material.views?.length || 0}
          </button>
        )}

        {/* Download – pill, h-11 (same as Assignments buttons) */}
        <a
          href={material.fileUrl}
          download
          onClick={onDownload}
          className="
          inline-flex h-11 items-center
          rounded-full border border-white/25
          bg-white/[0.12] px-4
          text-xs font-semibold text-white
          shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
          hover:bg-white/[0.2]
          transition
          flex-shrink-0
        "
        >
          <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
          Download Zip
        </a>

        {/* Edit / Delete – circular glass icons, also h-11 */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              title="Edit"
              className="
              flex h-11 w-11 items-center justify-center
              rounded-full border border-white/35
              bg-white/[0.06]
              text-white/80
              shadow-[inset_0_0_12px_rgba(255,255,255,0.26)]
              hover:bg-white/[0.16]
              transition
              flex-shrink-0
            "
            >
              <PencilIcon className="h-4 w-4" />
            </button>

            <button
              onClick={onDelete}
              title="Delete"
              className="
              flex h-11 w-11 items-center justify-center
              rounded-full border border-white/40
              bg-white/[0.08]
              text-white
              shadow-[inset_0_0_14px_rgba(255,255,255,0.3)]
              hover:bg-white/[0.2]
              transition
              flex-shrink-0
            "
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------- Edit Material Modal ----------------- */

const EditMaterialModal = ({ material, classes, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    title: material.title,
    classId: material.class?._id || '',
    week: material.week || '1',
  });
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('classId', formData.classId);
    data.append('week', formData.week);
    if (file) data.append('file', file);
    onUpdate(material._id, data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-[10px] shadow-[inset_0_0_20px_rgba(255,255,255,0.16)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Edit Material
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
              w-full h-11 rounded-full
              border border-white/25 bg-white/[0.04]
              px-5 text-sm text-white
              outline-none backdrop-blur-[8px]
            "
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <GlassSelect
              value={formData.classId}
              onChange={(v) => setFormData({ ...formData, classId: v })}
              options={classes.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
              placeholder="Select class"
            />
            <GlassSelect
              value={formData.week}
              onChange={(v) => setFormData({ ...formData, week: v })}
              options={Array.from({ length: 14 }, (_, i) => i + 1).map(
                (w) => ({
                  value: String(w),
                  label: `Week ${w}`,
                })
              )}
              placeholder="Select week"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center rounded-2xl border border-white/12 bg-white/[0.02] p-3">
            <label
              className="
                flex cursor-pointer items-center rounded-full
                border border-white/20 bg-white/[0.04]
                px-3 py-2 text-sm text-white
              "
            >
              <PaperClipIcon className="mr-2 h-4 w-4" />
              Replace File
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            <span className="text-sm text-white/60 italic">
              {file ? file.name : 'Current file will be kept'}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-white/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                rounded-full bg-white/[0.12]
                px-4 py-2 text-sm text-white
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

/* ----------------- Viewers Modal ----------------- */

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
          w-full max-w-sm rounded-2xl border border-white/25
          bg-white/[0.06] px-5 py-4
          backdrop-blur-[12px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.2)]
        "
      >
        <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-2">
          <h3 className="flex items-center text-sm font-semibold text-white">
            <UserGroupIcon className="mr-2 h-5 w-5 text-white/80" /> Viewed By (
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
                <span className="text-[11px] text-white/70">
                  {v.email}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Materials;
