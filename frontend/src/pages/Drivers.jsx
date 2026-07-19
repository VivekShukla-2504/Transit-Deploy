import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusTag from '../components/StatusTag';
import Modal from '../components/Modal';
import {
  Field,
  Input,
  Select,
  Banner,
  PrimaryButton,
  SecondaryButton,
} from '../components/FormField';

const EMPTY_FORM = {
  name: '',
  email: '',
  licenseNumber: '',
  licenseCategory: '',
  licenseExpiryDate: '',
  contactNumber: '',
  safetyScore: 100,
  status: 'Available',
};

function isExpired(dateStr) {
  return new Date(dateStr) < new Date();
}

export default function Drivers() {
  const { user } = useAuth();
  const canManage = user?.role === 'FleetManager' || user?.role === 'SafetyOfficer';
  const canDelete = user?.role === 'FleetManager';

  const [drivers, setDrivers] = useState([]);
  const [meta, setMeta] = useState({ statuses: [] });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const params = {};

    if (statusFilter) params.status = statusFilter;

    api
      .get('/drivers', { params })
      .then(({ data }) => setDrivers(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/drivers/meta').then(({ data }) => setMeta(data));
  }, []);

  useEffect(load, [statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (driver) => {
    setEditing(driver);
    setForm({
      name: driver.name,
      email: driver.email || '',
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiryDate: driver.licenseExpiryDate?.slice(0, 10) || '',
      contactNumber: driver.contactNumber,
      safetyScore: driver.safetyScore,
      status: driver.status,
    });
    setError('');
    setModalOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        safetyScore: Number(form.safetyScore),
      };

      if (editing) {
        await api.put(`/drivers/${editing._id}`, payload);
      } else {
        await api.post('/drivers', payload);
      }

      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save driver.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (driver) => {
    if (!confirm(`Delete driver ${driver.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/drivers/${driver._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete driver.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">
            Driver Management
          </p>
          <h1 className="font-display text-2xl font-semibold">Driver profiles</h1>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="">All statuses</option>
            {meta.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          {canManage && (
            <PrimaryButton
              onClick={openCreate}
              className="flex w-full items-center justify-center gap-1.5 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add driver
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="scrollbar-thin overflow-x-auto rounded border border-base-700 bg-base-900">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">License No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">License Expiry</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Safety Score</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400">
                  Loading…
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-base-400">
                  No drivers registered yet.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr
                  key={driver._id}
                  className="border-b border-base-800 last:border-0 hover:bg-base-800/50"
                >
                  <td className="px-4 py-3 font-medium">{driver.name}</td>
                  <td className="px-4 py-3 text-base-400">{driver.email}</td>
                  <td className="mono px-4 py-3">{driver.licenseNumber}</td>
                  <td className="px-4 py-3">{driver.licenseCategory}</td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        isExpired(driver.licenseExpiryDate)
                          ? 'flex items-center gap-1 text-danger-500'
                          : ''
                      }
                    >
                      {isExpired(driver.licenseExpiryDate) && (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="px-4 py-3">{driver.contactNumber}</td>
                  <td className="px-4 py-3">{driver.safetyScore}</td>
                  <td className="px-4 py-3">
                    <StatusTag status={driver.status} />
                  </td>

                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEdit(driver)}
                          className="rounded p-1 text-base-400 hover:bg-base-800 hover:text-signal-500"
                          aria-label={`Edit ${driver.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => remove(driver)}
                            className="rounded p-1 text-base-400 hover:bg-base-800 hover:text-danger-500"
                            aria-label={`Delete ${driver.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit driver' : 'Add driver'}
      >
        {error && <Banner tone="danger">{error}</Banner>}

        <form onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>

            <Field label="Email address" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="driver@transitops.com"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="License number" required>
              <Input
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                required
              />
            </Field>

            <Field label="License category" required>
              <Input
                value={form.licenseCategory}
                onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
                required
                placeholder="LMV / HMV"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="License expiry date" required>
              <Input
                type="date"
                value={form.licenseExpiryDate}
                onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })}
                required
              />
            </Field>

            <Field label="Contact number" required>
              <Input
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Safety score (0-100)">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.safetyScore}
                onChange={(e) => setForm({ ...form, safetyScore: e.target.value })}
              />
            </Field>

            {editing && (
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {meta.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <SecondaryButton
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </SecondaryButton>

            <PrimaryButton
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Saving…' : 'Save driver'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}