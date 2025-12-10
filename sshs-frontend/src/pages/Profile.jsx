import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  UserCircleIcon,
  AcademicCapIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

// ---------- Shared Glass Select ----------
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
    <div ref={ref} className={`relative min-w-0 ${className}`}>
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
            absolute left-0 right-0 z-40 mt-2
            rounded-2xl overflow-hidden
            border border-white/25 bg-black/[0.85]
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
                      ? 'bg-white/10 font-semibold'
                      : 'hover:bg-white/10'
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

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      {/* Header + Tabs in glass card */}
      <div
        className="
          mb-6 rounded-[1.75rem]
          border border-white/25
          bg-white/[0.04]
          px-5 py-5
          backdrop-blur-[12px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]
        "
      >
        <h1 className="mb-4 text-2xl font-semibold text-white">
          Settings
        </h1>

        {user.role === 'admin' && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            <TabButton
              id="profile"
              label="My Profile"
              active={activeTab}
              onClick={setActiveTab}
              icon={<UserCircleIcon className="mr-2 h-5 w-5" />}
            />
            <TabButton
              id="users"
              label="Manage Users"
              active={activeTab}
              onClick={setActiveTab}
              icon={<PlusCircleIcon className="mr-2 h-5 w-5" />}
            />
            <TabButton
              id="classes"
              label="Manage Classes"
              active={activeTab}
              onClick={setActiveTab}
              icon={<AcademicCapIcon className="mr-2 h-5 w-5" />}
            />
          </div>
        )}
      </div>

      {/* Content Card */}
      <div
        className="
          rounded-[1.75rem]
          border border-white/20
          bg-white/[0.04]
          px-5 py-5
          backdrop-blur-[10px]
          shadow-[inset_0_0_18px_rgba(255,255,255,0.18)]
        "
      >
        {activeTab === 'profile' && <EditProfileForm user={user} />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'classes' && <ManageClasses />}
      </div>
    </div>
  );
};

const TabButton = ({ id, label, active, onClick, icon }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`
      flex h-11 items-center whitespace-nowrap
      rounded-full px-5 text-sm transition-all border
      ${
        active === id
          ? 'border-white/70 bg-white/[0.26] text-white shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]'
          : 'border-white/18 bg-white/[0.06] text-white/75 hover:bg-white/[0.14] hover:text-white'
      }
    `}
  >
    {icon} {label}
  </button>
);

// --- 1. Edit Profile Form ---
const EditProfileForm = ({ user }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    address: user.address || '',
    password: '',
    gradeLevel: user.gradeLevel || '',
    major: user.major || '',
  });

  // keep local form data in sync if user object changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      address: user.address || '',
      gradeLevel: user.gradeLevel || '',
      major: user.major || '',
    }));
  }, [user.name, user.email, user.address, user.gradeLevel, user.major]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // send all editable profile fields;
      // only include password if the user actually typed one
      const payload = {
        name: formData.name,
        email: formData.email,
        address: formData.address,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (user.role === 'student') {
        payload.gradeLevel = formData.gradeLevel;
        payload.major = formData.major;
      }

      const { data } = await api.put('/auth/profile', payload);
      alert('Profile Updated!');
      localStorage.setItem('sshs_user', JSON.stringify(data));
      window.location.reload();
    } catch (error) {
      alert('Update failed');
    }
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-sm text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]';

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <h2 className="mb-2 text-lg font-semibold text-white">
        Edit Your Details
      </h2>

      <div>
        <label className="mb-1 block text-xs text-white/70">Full Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className={inputBase}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/70">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className={inputBase}
        />
      </div>

      {user.role === 'student' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Grade Level
            </label>
            <div
              className="
                flex h-11 items-center rounded-full
                border border-white/25 bg-white/[0.03]
                px-4 text-sm text-white/70
                backdrop-blur-[8px]
                shadow-[inset_0_0_10px_rgba(255,255,255,0.18)]
              "
            >
              Grade {formData.gradeLevel || 'Not Set'}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Major</label>
            <div
              className="
                flex h-11 items-center rounded-full
                border border-white/25 bg-white/[0.03]
                px-4 text-sm text-white/70
                backdrop-blur-[8px]
                shadow-[inset_0_0_10px_rgba(255,255,255,0.18)]
              "
            >
              {formData.major}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-white/70">Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          className={inputBase}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-white/70">
          New Password (leave blank to keep current)
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className={inputBase}
        />
      </div>

      <button
        type="submit"
        className="
          mt-2 h-11 rounded-full border border-white/30
          bg-white/[0.26] px-5 text-sm font-semibold text-white
          shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]
          hover:bg-white/[0.34]
        "
      >
        Save Changes
      </button>
    </form>
  );
};

// --- 2. User Management ---
const UserManagement = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    address: '',
    gradeLevel: '10',
    major: 'None',
  });
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const students = await api.get('/auth/users/student');
      const teachers = await api.get('/auth/users/teacher');
      setUsers([...teachers.data, ...students.data]);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('User Created Successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        address: '',
        gradeLevel: '10',
        major: 'None',
      });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Creation failed');
    }
  };

  const handleImport = async (e) => {
    if (!e.target.files[0]) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);

    try {
      const { data } = await api.post('/auth/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(data.message);
      fetchUsers();
    } catch (err) {
      alert('Import Failed');
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This action cannot be undone.'))
      return;
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase(),
      ),
  );
  const teacherList = filteredUsers.filter((u) => u.role === 'teacher');
  const studentList = filteredUsers.filter((u) => u.role === 'student');

  const UserRow = ({ u }) => (
    <tr className="border-b border-white/10 last:border-0 hover:bg-white/[0.03]">
      <td className="px-4 py-3 text-sm font-medium text-white">{u.name}</td>
      <td className="px-4 py-3 text-xs text-white/70">{u.email}</td>
      <td className="px-4 py-3 text-xs text-white/70">
        {u.role === 'student'
          ? `Grade ${u.gradeLevel} (${u.major})`
          : u.address || '-'}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditingUser(u)}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-full border border-white/25
              bg-white/[0.08] text-white/80
              shadow-[inset_0_0_12px_rgba(255,255,255,0.22)]
              hover:bg-white/[0.18] hover:text-white
            "
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(u._id)}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-full border border-white/25
              bg-white/[0.08] text-white/80
              shadow-[inset_0_0_12px_rgba(255,255,255,0.22)]
              hover:bg-white/[0.18] hover:text-white
            "
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-xs text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]';

  return (
    <div className="space-y-8">
      {/* Create User */}
      <div
        className="
          rounded-2xl border border-white/20
          bg-white/[0.04] p-5
          backdrop-blur-[10px]
          shadow-[inset_0_0_18px_rgba(255,255,255,0.2)]
        "
      >
        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="flex items-center text-base font-semibold text-white">
            <PlusCircleIcon className="mr-2 h-5 w-5" />
            Create New User
          </h2>

          <label
            className="
              flex h-11 cursor-pointer items-center justify-center gap-2
              rounded-full border border-white/30
              bg-white/[0.2] px-4 text-xs font-semibold text-white
              shadow-[inset_0_0_16px_rgba(255,255,255,0.3)]
              hover:bg-white/[0.3]
            "
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className={inputBase}
            required
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <GlassSelect
              value={formData.role}
              onChange={(v) => setFormData({ ...formData, role: v })}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'teacher', label: 'Teacher' },
              ]}
              className="flex-1"
            />

            {formData.role === 'student' && (
              <>
                <GlassSelect
                  value={formData.gradeLevel}
                  onChange={(v) =>
                    setFormData({ ...formData, gradeLevel: v })
                  }
                  options={[
                    { value: '10', label: 'Grade 10' },
                    { value: '11', label: 'Grade 11' },
                    { value: '12', label: 'Grade 12' },
                  ]}
                  className="flex-1"
                />
                <GlassSelect
                  value={formData.major}
                  onChange={(v) =>
                    setFormData({ ...formData, major: v })
                  }
                  options={[
                    { value: 'None', label: 'No Major' },
                    { value: 'Science', label: 'Science' },
                    { value: 'Social', label: 'Social' },
                  ]}
                  className="flex-1"
                />
              </>
            )}
          </div>

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={inputBase}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className={inputBase}
            required
          />
          <input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className={`md:col-span-2 ${inputBase}`}
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              className="
                h-11 w-full rounded-full border border-white/30
                bg-white/[0.26] px-6 text-sm font-semibold text-white
                shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]
                hover:bg-white/[0.34]
                md:w-auto
              "
            >
              Create User
            </button>
          </div>
        </form>
        <p className="mt-3 text-[10px] text-white/60">
          CSV header format: name, email, password, role, address, gradeLevel,
          major
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/60" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            h-11 w-full rounded-full border border-white/25
            bg-white/[0.05] pl-10 pr-4 text-xs text-white
            placeholder-white/60 outline-none
            backdrop-blur-[10px]
            shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
            focus:ring-2 focus:ring-white/40
          "
        />
      </div>

      {/* Lists */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-white">
          Teachers ({teacherList.length})
        </h2>
        <div
          className="
            overflow-hidden rounded-2xl border border-white/20
            bg-white/[0.04] backdrop-blur-[10px]
            shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]
          "
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <tbody>
                {teacherList.map((u) => (
                  <UserRow key={u._id} u={u} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-white">
          Students ({studentList.length})
        </h2>
        <div
          className="
            overflow-hidden rounded-2xl border border-white/20
            bg-white/[0.04] backdrop-blur-[10px]
            shadow-[inset_0_0_16px_rgba(255,255,255,0.18)]
          "
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <tbody>
                {studentList.map((u) => (
                  <UserRow key={u._id} u={u} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
};

// --- Edit User Modal ---
const EditUserModal = ({ user, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    address: user.address || '',
    password: '',
    gradeLevel: user.gradeLevel || '10',
    major: user.major || 'None',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/users/${user._id}`, formData);
      alert('User Updated!');
      onRefresh();
      onClose();
    } catch (error) {
      alert('Update failed: ' + error.response?.data?.message);
    }
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-xs text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="
          w-full max-w-md rounded-2xl border border-white/25
          bg-white/[0.06] p-6
          backdrop-blur-[14px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.24)]
        "
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/15 pb-2">
          <h3 className="text-lg font-semibold text-white">Edit User</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className={inputBase}
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={inputBase}
          />

          {user.role === 'student' && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <GlassSelect
                value={formData.gradeLevel}
                onChange={(v) =>
                  setFormData({ ...formData, gradeLevel: v })
                }
                options={[
                  { value: '10', label: 'Grade 10' },
                  { value: '11', label: 'Grade 11' },
                  { value: '12', label: 'Grade 12' },
                ]}
              />
              <GlassSelect
                value={formData.major}
                onChange={(v) =>
                  setFormData({ ...formData, major: v })
                }
                options={[
                  { value: 'None', label: 'No Major' },
                  { value: 'Science', label: 'Science' },
                  { value: 'Social', label: 'Social' },
                ]}
              />
            </div>
          )}

          <input
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className={inputBase}
            placeholder="Address"
          />
          <input
            type="password"
            placeholder="New Password (Optional)"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className={inputBase}
          />

          <div className="flex flex-col justify-end gap-3 pt-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full px-4 text-xs text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                h-9 rounded-full border border-white/30
                bg-white/[0.26] px-4 text-xs font-semibold text-white
                shadow-[inset_0_0_16px_rgba(255,255,255,0.3)]
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

// --- 3. Manage Classes ---
const ManageClasses = () => {
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('10');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:30');
  const [category, setCategory] = useState('Mandatory');
  const [teacherId, setTeacherId] = useState('');

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [editingClass, setEditingClass] = useState(null);

  // NEW: Import state
  const [importing, setImporting] = useState(false);
  // NEW: Class search state
  const [classSearchQuery, setClassSearchQuery] = useState('');

  useEffect(() => {
    fetchClasses();
    api.get('/auth/users/teacher').then((res) => setTeachers(res.data));
  }, []);

  const fetchClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', {
        name: className,
        gradeLevel,
        day,
        startTime,
        endTime,
        category,
        teacherId,
      });
      alert('Class Created!');
      setClassName('');
      setStartTime('07:00');
      setEndTime('08:30');
      setTeacherId('');
      fetchClasses();
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || 'Error'));
    }
  };

  // NEW: Handle Class CSV Import
  const handleImport = async (e) => {
    if (!e.target.files[0]) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);

    try {
      const { data } = await api.post('/classes/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(data.message);
      fetchClasses();
    } catch (err) {
      alert('Import Failed');
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 7; i <= 17; i++) {
      const hour = i < 10 ? `0${i}` : i;
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-xs text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.18)]';

  const filteredClasses = classes.filter((c) => {
    const q = classSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.teacher?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="border-b border-white/15 pb-6">
        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-base font-semibold text-white">
            Create Class
          </h2>
          {/* IMPORT BUTTON FOR CLASSES */}
          <label
            className="
              flex h-11 cursor-pointer items-center justify-center gap-2
              rounded-full border border-white/30
              bg-white/[0.2] px-4 text-xs font-semibold text-white
              shadow-[inset_0_0_16px_rgba(255,255,255,0.3)]
              hover:bg-white/[0.3]
            "
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>

        <form
          onSubmit={handleCreate}
          className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            placeholder="Class Name (e.g. Math 101)"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className={inputBase}
            required
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <GlassSelect
              value={gradeLevel}
              onChange={setGradeLevel}
              options={[
                { value: '10', label: 'Grade 10' },
                { value: '11', label: 'Grade 11' },
                { value: '12', label: 'Grade 12' },
              ]}
              className="flex-1"
            />
            <GlassSelect
              value={day}
              onChange={setDay}
              options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                (d) => ({ value: d, label: d }),
              )}
              className="flex-1"
            />
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <GlassSelect
              value={startTime}
              onChange={setStartTime}
              options={generateTimeSlots().map((t) => ({
                value: t,
                label: t,
              }))}
              className="flex-1"
            />
            <span className="text-xs text-white/60 text-center sm:text-left">
              -
            </span>
            <GlassSelect
              value={endTime}
              onChange={setEndTime}
              options={generateTimeSlots().map((t) => ({
                value: t,
                label: t,
              }))}
              className="flex-1"
            />
          </div>

          <div className="col-span-2 flex flex-col gap-3 md:col-span-1 md:flex-row">
            <GlassSelect
              value={teacherId}
              onChange={setTeacherId}
              options={[
                { value: '', label: 'Select Teacher (Optional)' },
                ...teachers.map((t) => ({ value: t._id, label: t.name })),
              ]}
              className="flex-1"
            />
            <GlassSelect
              value={category}
              onChange={setCategory}
              options={[
                { value: 'Mandatory', label: 'Mandatory' },
                { value: 'Science', label: 'Science Only' },
                { value: 'Social', label: 'Social Only' },
              ]}
              className="flex-1"
            />
          </div>

          <button
            type="submit"
            className="
              col-span-2 md:col-span-1
              h-11 rounded-full border border-white/30
              bg-white/[0.26] px-6 text-sm font-semibold text-white
              shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]
              hover:bg-white/[0.34]
            "
          >
            Create Class
          </button>
        </form>
        <p className="mt-3 text-[10px] text-white/60">
          CSV Format: name, gradeLevel, day, startTime, endTime, category
        </p>
      </div>

      {/* Existing Classes */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-white">
          Existing Classes
        </h2>

        {/* Class Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-white/60" />
          <input
            type="text"
            placeholder="Search classes..."
            value={classSearchQuery}
            onChange={(e) => setClassSearchQuery(e.target.value)}
            className="
              h-11 w-full rounded-full border border-white/25
              bg-white/[0.05] pl-10 pr-4 text-xs text-white
              placeholder-white/60 outline-none
              backdrop-blur-[10px]
              shadow-[inset_0_0_14px_rgba(255,255,255,0.22)]
              focus:ring-2 focus:ring-white/40
            "
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((c) => (
            <div
              key={c._id}
              className="
                relative flex h-40 flex-col justify-between
                rounded-2xl border border-white/20
                bg-white/[0.04] p-4
                backdrop-blur-[10px]
                shadow-[inset_0_0_18px_rgba(255,255,255,0.2)]
              "
            >
              <span
                className="
                  absolute right-3 top-3
                  rounded-full border border-white/40
                  bg-white/[0.16] px-3 py-0.5
                  text-[10px] font-semibold  text-white
                "
              >
                {c.category}
              </span>
              <div>
                <h3 className="text-m font-semibold text-white">
                  {c.name}
                </h3>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/75">
                  <span className="rounded-full border border-white/30 bg-white/[0.08] px-2 py-0.5">
                    Grade {c.gradeLevel}
                  </span>
                  <span className="rounded-full border border-white/30 bg-white/[0.08] px-2 py-0.5">
                    {c.day} {c.startTime} - {c.endTime}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/70">
                  Teacher: {c.teacher?.name || 'Unassigned'}
                </p>
              </div>
              <div className="mt-2 flex items-end justify-between text-[11px] text-white/65">
                <span>{c.students.length} Students</span>
                <button
                  type="button"
                  onClick={() => setEditingClass(c)}
                  className="inline-flex items-center text-xs text-white/85 underline hover:text-white"
                >
                  <PencilSquareIcon className="mr-1 h-4 w-4" />
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingClass && (
        <EditClassModal
          cls={editingClass}
          onClose={() => setEditingClass(null)}
          onRefresh={fetchClasses}
        />
      )}
    </div>
  );
};

const EditClassModal = ({ cls, onClose, onRefresh }) => {
  const [name, setName] = useState(cls.name);
  const [teacherId, setTeacherId] = useState(cls.teacher?._id || '');
  const [gradeLevel, setGradeLevel] = useState(cls.gradeLevel || '10');
  const [day, setDay] = useState(cls.day || 'Monday');
  const [startTime, setStartTime] = useState(cls.startTime || '07:00');
  const [endTime, setEndTime] = useState(cls.endTime || '08:30');
  const [category, setCategory] = useState(cls.category || 'Mandatory');

  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    api.get('/auth/users/teacher').then((res) => setTeachers(res.data));
  }, []);

  const handleUpdate = async () => {
    try {
      await api.put(`/classes/${cls._id}`, {
        name,
        teacherId,
        gradeLevel,
        day,
        startTime,
        endTime,
        category,
      });
      alert('Class Updated!');
      onRefresh();
      onClose();
    } catch (e) {
      alert('Update failed: ' + e.response?.data?.message);
    }
  };

  const handleDeleteClass = async () => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/classes/${cls._id}`);
      alert('Class Deleted!');
      onRefresh();
      onClose();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove student?')) return;
    try {
      await api.put('/classes/remove-student', {
        classId: cls._id,
        studentId,
      });
      onRefresh();
      onClose();
    } catch (e) {
      alert('Failed to remove student');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 7; i <= 17; i++) {
      const hour = i < 10 ? `0${i}` : i;
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  const inputBase =
    'h-11 w-full rounded-full border border-white/25 bg-white/[0.05] px-4 text-xs text-white outline-none backdrop-blur-[8px] shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
      <div
        className="
          max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-2xl
          rounded-2xl border border-white/25
          bg-white/[0.06] p-4 sm:p-6
          backdrop-blur-[14px]
          shadow-[inset_0_0_22px_rgba(255,255,255,0.24)]
        "
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/15 pb-2">
          <h3 className="text-lg font-semibold text-white">
            Manage Class: {cls.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputBase}
              placeholder="Class Name"
            />
            <GlassSelect
              value={teacherId}
              onChange={setTeacherId}
              options={[
                { value: '', label: 'Unassigned' },
                ...teachers.map((t) => ({ value: t._id, label: t.name })),
              ]}
            />
            <GlassSelect
              value={gradeLevel}
              onChange={setGradeLevel}
              options={[
                { value: '10', label: 'Grade 10' },
                { value: '11', label: 'Grade 11' },
                { value: '12', label: 'Grade 12' },
              ]}
            />
            <GlassSelect
              value={day}
              onChange={setDay}
              options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                (d) => ({ value: d, label: d }),
              )}
            />
            <div className="col-span-1 flex flex-col items-stretch gap-2 sm:col-span-2 sm:flex-row sm:items-center">
              <span className="text-xs text-white/70">Time:</span>
              <GlassSelect
                value={startTime}
                onChange={setStartTime}
                options={generateTimeSlots().map((t) => ({
                  value: t,
                  label: t,
                }))}
                className="flex-1"
              />
              <span className="text-xs text-white/60 text-center sm:text-left">
                -
              </span>
              <GlassSelect
                value={endTime}
                onChange={setEndTime}
                options={generateTimeSlots().map((t) => ({
                  value: t,
                  label: t,
                }))}
                className="flex-1"
              />
            </div>
            <div className="col-span-1 flex flex-col items-stretch gap-2 sm:col-span-2 sm:flex-row sm:items-center">
              <span className="text-xs text-white/70">Category:</span>
              <GlassSelect
                value={category}
                onChange={setCategory}
                options={[
                  { value: 'Mandatory', label: 'Mandatory' },
                  { value: 'Science', label: 'Science Only' },
                  { value: 'Social', label: 'Social Only' },
                ]}
                className="flex-1"
              />
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleDeleteClass}
              className="inline-flex items-center text-xs text-white/80 hover:text-white"
            >
              <TrashIcon className="mr-1 h-4 w-4" />
              Delete Class
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="
                h-9 rounded-full border border-white/30
                bg-white/[0.26] px-5 text-xs font-semibold text-white
                shadow-[inset_0_0_16px_rgba(255,255,255,0.3)]
                hover:bg-white/[0.34]
              "
            >
              Save Changes
            </button>
          </div>
        </div>

        <div>
          <h4 className="mb-2 border-b border-white/15 pb-1 text-sm font-medium text-white">
            Enrolled Students ({cls.students.length})
          </h4>
          <div className="max-h-40 rounded-2xl border border-white/15 bg-white/[0.03]">
            <ul className="divide-y divide-white/10">
              {cls.students.map((s) => (
                <li
                  key={s._id}
                  className="flex items-center justify-between px-3 py-2 text-xs text-white/80"
                >
                  <span>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(s._id)}
                    className="text-white/75 hover:text-white"
                    title="Remove"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {cls.students.length === 0 && (
                <li className="px-3 py-3 text-xs text-white/60">
                  No students enrolled.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
