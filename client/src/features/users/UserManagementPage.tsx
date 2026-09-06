import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/formatters';
import { UserModal } from './UserModal';
import { Shield, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (u: any) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own active user account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user account '${u.email}'?`)) {
      return;
    }

    try {
      setDeletingId(u.id);
      await apiClient.delete(`/users/${u.id}`);
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user account.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.employee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">System User Administration</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Administer application access credentials, role tiers, active status, and link users with employee profiles.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New User Account</span>
        </button>
      </div>

      {/* Controls / Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users or linked employees..."
            className="w-full bg-background border border-input rounded-md py-1.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">User / Work Email</th>
                <th className="px-6 py-3.5">Linked Employee</th>
                <th className="px-6 py-3.5">Assigned Roles</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-foreground">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      {u.employee ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{u.employee.name}</span>
                          <span className="text-[10px] text-muted-foreground">({u.employee.jobPosition?.title || 'Staff'})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">No employee linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((r: string) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border text-[10px] font-semibold"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.isActive ? 'active' : 'inactive'} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs transition-colors border border-border"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Roles</span>
                        </button>

                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id || u.id === currentUser?.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs transition-colors border border-rose-500/30 disabled:opacity-40"
                          title={u.id === currentUser?.id ? 'Cannot delete current logged-in user' : 'Delete user account'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        userToEdit={editingUser}
      />
    </div>
  );
};

