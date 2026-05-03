// frontend/src/components/Users/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { userAPI, authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [regForm, setRegForm] = useState({ full_name: '', email: '', password: '', role: 'cashier' });

  const load = async () => {
    setLoading(true);
    const { data } = await userAPI.getAll();
    setUsers(data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id, role) => {
    await userAPI.updateRole(id, role);
    toast.success('Role updated');
    load();
  };

  const handleToggle = async (id) => {
    await userAPI.toggleActive(id);
    toast.success('Status changed');
    load();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await authAPI.register(regForm);
      toast.success('User created! They need to confirm their email.');
      setModal(false);
      setRegForm({ full_name: '', email: '', password: '', role: 'cashier' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const set = (k) => (e) => setRegForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add User</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 13 }}>
                        {u.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select className="form-control" style={{ maxWidth: 130, padding: '4px 8px', fontSize: 12 }}
                      value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => handleToggle(u.id)}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add New User</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="modal-body">
                <div className="form-group"><label>Full Name *</label>
                  <input className="form-control" required value={regForm.full_name} onChange={set('full_name')} /></div>
                <div className="form-group"><label>Email *</label>
                  <input className="form-control" type="email" required value={regForm.email} onChange={set('email')} /></div>
                <div className="form-group"><label>Password *</label>
                  <input className="form-control" type="password" required minLength={6}
                    value={regForm.password} onChange={set('password')} /></div>
                <div className="form-group"><label>Role</label>
                  <select className="form-control" value={regForm.role} onChange={set('role')}>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
