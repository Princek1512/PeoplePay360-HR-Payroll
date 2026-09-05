import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { ModeToggle } from '../../components/layout/mode-toggle';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@peoplepay360.com', pass: 'Admin@123' },
    { label: 'HR Payroll Manager', email: 'payroll.manager@peoplepay360.com', pass: 'Password@123' },
    { label: 'HR Manager', email: 'hr.manager@peoplepay360.com', pass: 'Password@123' },
    { label: 'HR Payroll User', email: 'payroll.user@peoplepay360.com', pass: 'Password@123' },
    { label: 'Employee', email: 'employee@peoplepay360.com', pass: 'Password@123' },
  ];

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ModeToggle />
      </div>

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            PeoplePay<span className="text-primary opacity-80">360</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">
            Integrated HR & Payroll Platform
          </p>
        </div>

        <div className="p-8 rounded-xl bg-card text-card-foreground border border-border shadow-lg">
          <h2 className="font-serif text-xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-xs text-muted-foreground mb-6">Sign in to your enterprise account</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@peoplepay360.com"
                  className="w-full bg-background border border-input rounded-md py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-background border border-input rounded-md py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to PeoplePay360</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Quick Demo Role Switcher
              </span>
              <span className="text-[10px] text-muted-foreground">Click to fill</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border text-xs transition-colors"
                >
                  <span className="font-medium">{acc.label}</span>
                  <span className="text-[11px] text-muted-foreground">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
