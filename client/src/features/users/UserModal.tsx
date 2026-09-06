import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';
import { UserRoleType } from '../../lib/rbac';
import { encryptPassword } from '../../lib/crypto';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: any | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToEdit
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([UserRoleType.EMPLOYEE]);
  const [isActive, setIsActive] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load unlinked or all employees
      apiClient.get('/employees').then((res) => {
        setEmployees(res.data.data);
      }).catch(console.error);

      if (userToEdit) {
        setEmail(userToEdit.email || '');
        setEmployeeId(userToEdit.employee?.id || '');
        setSelectedRoles(userToEdit.roles || [UserRoleType.EMPLOYEE]);
        setIsActive(userToEdit.isActive ?? true);
        setPassword('');
      } else {
        setEmail('');
        setPassword('');
        setEmployeeId('');
        setSelectedRoles([UserRoleType.EMPLOYEE]);
        setIsActive(true);
      }
      setError(null);
    }
  }, [isOpen, userToEdit]);

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (userToEdit) {
        await apiClient.patch(`/users/${userToEdit.id}`, {
          roles: selectedRoles,
          isActive
        });
      } else {
        await apiClient.post('/users', {
          email,
          password: encryptPassword(password.trim()),
          employeeId: employeeId || null,
          roles: selectedRoles,
          isActive
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setLoading(false);
    }
  };


  const availableRoles = [
    UserRoleType.EMPLOYEE,
    UserRoleType.HR_MANAGER,
    UserRoleType.HR_PAYROLL_USER,
    UserRoleType.HR_PAYROLL_MANAGER
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? 'Edit User Roles & Access' : 'Create New System User'}
      subtitle="Configure role permissions and link with an employee record"
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
            Work Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!userToEdit}
            placeholder="user@peoplepay360.com"
            className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 font-mono"
            required
          />
        </div>

        {!userToEdit && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
            Link to Employee Record
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={!!userToEdit}
            className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          >
            <option value="">-- No Employee Linked (System User) --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Assigned Roles
          </label>
          <div className="space-y-2">
            {availableRoles.map((role) => (
              <label
                key={role}
                className="flex items-center gap-2.5 p-2.5 rounded-md bg-secondary/60 border border-border hover:border-primary/40 cursor-pointer text-xs text-foreground"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span className="font-semibold">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-input text-primary"
          />
          <label htmlFor="isActive" className="text-xs font-medium text-foreground cursor-pointer">
            Account is Active
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          {userToEdit ? (
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`Permanently delete user account '${userToEdit.email}'?`)) return;
                try {
                  setLoading(true);
                  await apiClient.delete(`/users/${userToEdit.id}`);
                  onSuccess();
                  onClose();
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Failed to delete user account.');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3.5 py-2 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/30 transition-all"
            >
              Delete Account
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : userToEdit ? 'Update Roles' : 'Create User'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );

};
