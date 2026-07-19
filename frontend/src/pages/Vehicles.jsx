import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  registrationNumber: '',
  name: '',
  type: 'Van',
  maxLoadCapacity: '',
  odometer: '',
  acquisitionCost: '',
  region: '',
  status: 'Available',
};

export default function Vehicles() {
  const { user } = useAuth();
  const canManage = user?.role === 'FleetManager';

  const [vehicles, setVehicles] = useState([]);
  const [meta, setMeta] = useState({ statuses: [], types: [] });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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
    if (typeFilter) params.type = typeFilter;

    api
      .get('/vehicles', { params })
      .then(({ data }) => setVehicles(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/vehicles/meta').then(({ data }) => setMeta(data));
  }, []);

  useEffect(load, [statusFilter, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (vehicle) => {
    setEditing(vehicle);
    setForm({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacity: vehicle.maxLoadCapacity,
      odometer: vehicle.odometer,
      acquisitionCost: vehicle.acquisitionCost,
      region: vehicle.region || '',
      status: vehicle.status,
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
        maxLoadCapacity: Number(form.maxLoadCapacity),
        odometer: Number(form.odometer || 0),
        acquisitionCost: Number(form.acquisitionCost),
      };

      if (editing) {
        await api.put(`/vehicles/${editing._id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }

      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (vehicle) => {
    if (!confirm(`Delete vehicle ${vehicle.registrationNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/vehicles/${vehicle._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete vehicle.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">
            Vehicle Registry
          </p>
          <h1 className="font-display text-2xl font-semibold">Fleet assets</h1>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="">All types</option>
            {meta.types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>

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
              Register vehicle
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="scrollbar-thin overflow-x-auto rounded border border-base-700 bg-base-900">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Name / Model</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Max Load</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-base-400">
                  Loading…
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-base-400">
                  No vehicles registered yet.
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr
                  key={vehicle._id}
                  className="border-b border-base-800 last:border-0 hover:bg-base-800/50"
                >
                  <td className="mono px-4 py-3">{vehicle.registrationNumber}</td>
                  <td className="px-4 py-3">{vehicle.name}</td>
                  <td className="px-4 py-3">{vehicle.type}</td>
                  <td className="px-4 py-3">{vehicle.maxLoadCapacity} kg</td>
                  <td className="px-4 py-3">
                    {vehicle.odometer.toLocaleString()} km
                  </td>
                  <td className="px-4 py-3">{vehicle.region}</td>
                  <td className="px-4 py-3">
                    <StatusTag status={vehicle.status} />
                  </td>

                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEdit(vehicle)}
                          className="rounded p-1 text-base-400 hover:bg-base-800 hover:text-signal-500"
                          aria-label={`Edit ${vehicle.registrationNumber}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => remove(vehicle)}
                          className="rounded p-1 text-base-400 hover:bg-base-800 hover:text-danger-500"
                          aria-label={`Delete ${vehicle.registrationNumber}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        title={editing ? 'Edit vehicle' : 'Register vehicle'}
      >
        {error && <Banner tone="danger">{error}</Banner>}

        <form onSubmit={submit}>
          <Field label="Registration number" required>
            <Input
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              required
              placeholder="DL-01-AB-1234"
            />
          </Field>

          <Field label="Name / model" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Tata Ace Gold"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Type" required>
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {(meta.types.length
                  ? meta.types
                  : ['Van', 'Truck', 'Mini Truck', 'Trailer', 'Bike']
                ).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Max load capacity (kg)" required>
              <Input
                type="number"
                min="0"
                value={form.maxLoadCapacity}
                onChange={(e) => setForm({ ...form, maxLoadCapacity: e.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Odometer (km)">
              <Input
                type="number"
                min="0"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
              />
            </Field>

            <Field label="Acquisition cost" required>
              <Input
                type="number"
                min="0"
                value={form.acquisitionCost}
                onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Region">
              <Input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="North"
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
              {saving ? 'Saving…' : 'Save vehicle'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}