import React from 'react';
import {
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Radio,
  Search,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSimulator: () => void;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenSimulator,
  onRefresh,
}) => {
  const { success, error } = useToast();

  const handleResetData = async () => {
    if (window.confirm('Reset all demo contacts, conversations, and rules back to initial sample state?')) {
      try {
        await api.settings.resetDemo();
        success('Demo Reset', 'Sandbox data restored to original demo state.');
        if (onRefresh) onRefresh();
      } catch (e: any) {
        error('Reset failed', e.message);
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>

          {/* Visible DEMO MODE Indicator (Requirement 11) */}
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-xs animate-pulse-subtle">
            <Radio className="w-3 h-3 text-amber-600 animate-pulse" />
            <span>DEMO SANDBOX MODE</span>
          </div>

          <Badge variant="whatsapp" dot>
            API v20.0 Ready
          </Badge>
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Reset Demo Data Button */}
        <button
          onClick={handleResetData}
          title="Restore original demo data"
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors font-medium border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo</span>
        </button>

        {/* Live Simulator CTA */}
        <Button
          variant="whatsapp"
          size="sm"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={onOpenSimulator}
        >
          Live Simulator
        </Button>
      </div>
    </header>
  );
};
