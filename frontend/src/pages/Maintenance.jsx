import { useEffect, useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusTag from '../components/StatusTag';
import Modal from '../components/Modal';
import {
  Field,
  Input,
  Select,
  TextArea,
  Banner,
  PrimaryButton,
  SecondaryButton,
} from '../components/FormField';

const EMPTY_FORM = {
  vehicle: '',
  type: '',
  description: '',
  cost: '',
};

export default function Maintenance() {
  const { user } = useAuth();
  const canManage = user?.role === 'FleetManager';

  const [logs, setLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [closing, setClosing] = useState(null);
  const [closeCost, setCloseCost] = useState('');
  const [retireVehicle, setRetireVehicle] = useState(false);
  const [closeError, setCloseError] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};

    if (statusFilter) params.status = statusFilter;

    api
      .get('/maintenance', { params })
      .then(({ data }) => setLogs(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError('');

    api
      .get('/vehicles', { params: { status: 'Available' } })
      .then(({ data }) => setVehicles(data));

    setCreateOpen(true);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/maintenance', {
        ...form,
        cost: form.cost ? Number(form.cost) : 0,
      });

      setCreateOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create maintenance record.');
    } finally {
      setSaving(false);
    }
  };

  const openClose = (log) => {
    setClosing(log);
    setCloseCost(log.cost || '');
    setRetireVehicle(false);
    setCloseError('');
  };

  const submitClose = async (event) => {
    event.preventDefault();
    setCloseError('');

    try {
      await api.post(`/maintenance/${closing._id}/close`, {
        cost: closeCost !== '' ? Number(closeCost) : undefined,
        retireVehicle,
      });

      setClosing(null);
      load();
    } catch (err) {
      setCloseError(err.response?.data?.message || 'Could not close maintenance record.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-base-400">
            Maintenance
          </p>
          <h1 className="font-display text-2xl font-semibold">Service log</h1>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </Select>

          {canManage && (
            <PrimaryButton
              onClick={openCreate}
              className="flex w-full items-center justify-center gap-1.5 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New record
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="scrollbar-thin overflow-x-auto rounded border border-base-700 bg-base-900">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="border-b border-base-700 text-left text-[11px] uppercase tracking-wide text-base-400">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-base-400">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-base-400">
                  No maintenance records yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log._id}
                  className="border-b border-base-800 last:border-0 hover:bg-base-800/50"
                >
                  <td className="mono px-4 py-3">
                    {log.vehicle?.registrationNumber}
                  </td>
                  <td className="px-4 py-3">{log.type}</td>
                  <td className="px-4 py-3 text-base-400">
                    {log.description || '—'}
                  </td>
                  <td className="px-4 py-3">{log.cost}</td>
                  <td className="px-4 py-3">
                    {new Date(log.openedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusTag status={log.status} />
                  </td>

                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {log.status === 'Open' && (
                        <button
                          onClick={() => openClose(log)}
                          title="Close"
                          aria-label="Close maintenance record"
                          className="rounded p-1 text-ok-500 hover:bg-base-800"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New maintenance record"
      >
        {error && <Banner tone="danger">{error}</Banner>}

        <form onSubmit={submitCreate}>
          <Field label="Vehicle" required>
            <Select
              value={form.vehicle}
              onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
              required
            >
              <option value="">Select an available vehicle…</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.registrationNumber} — {vehicle.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Maintenance type" required>
            <Input
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
              placeholder="Oil Change, Tire Replacement…"
            />
          </Field>

          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </Field>

          <Field label="Estimated cost">
            <Input
              type="number"
              min="0"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </Field>

          <p className="mb-3 text-xs text-base-400">
            Creating this record will move the vehicle to &quot;In Shop&quot; and
            remove it from dispatch selection.
          </p>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <SecondaryButton
              type="button"
              onClick={() => setCreateOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </SecondaryButton>

            <PrimaryButton
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Saving…' : 'Send to maintenance'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!closing}
        onClose={() => setClosing(null)}
        title="Close maintenance record"
      >
        {closeError && <Banner tone="danger">{closeError}</Banner>}

        <form onSubmit={submitClose}>
          <Field label="Final cost">
            <Input
              type="number"
              min="0"
              value={closeCost}
              onChange={(e) => setCloseCost(e.target.value)}
            />
          </Field>

          <label className="mb-3 flex items-start gap-2 text-sm text-base-200">
            <input
              type="checkbox"
              checked={retireVehicle}
              onChange={(e) => setRetireVehicle(e.target.checked)}
              className="mt-0.5"
            />
            <span>Retire this vehicle instead of returning it to service</span>
          </label>

          <p className="mb-3 text-xs text-base-400">
            {retireVehicle
              ? 'Vehicle will be marked Retired and hidden from dispatch permanently.'
              : 'Vehicle will return to Available status.'}
          </p>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <SecondaryButton
              type="button"
              onClick={() => setClosing(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </SecondaryButton>

            <PrimaryButton type="submit" className="w-full sm:w-auto">
              Close record
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}