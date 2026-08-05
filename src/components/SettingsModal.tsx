import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Sliders, Database, Save, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearAllSessions?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllSessions,
}) => {
  const [formData, setFormData] = React.useState<AppSettings>(settings);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-[#121217] border border-white/15 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#16161c]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Nexus Agent Configuration</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Simulation Speed & Depth */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Execution & Reasoning Speed
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Simulation Speed:
                    </label>
                    <select
                      value={formData.simulationSpeed}
                      onChange={(e) =>
                        setFormData({ ...formData, simulationSpeed: e.target.value as any })
                      }
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="1x">Standard Realtime (1x)</option>
                      <option value="2x">Accelerated (2x)</option>
                      <option value="instant">Instant Result</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      Default Depth:
                    </label>
                    <select
                      value={formData.defaultDepth}
                      onChange={(e) =>
                        setFormData({ ...formData, defaultDepth: e.target.value as any })
                      }
                      className="w-full bg-[#18181f] border border-white/10 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="Fast">Fast (1-2 Queries)</option>
                      <option value="Deep">Deep Research (4 Queries)</option>
                      <option value="Exhaustive">Exhaustive (8 Queries)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* API Credentials */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> API Keys & Connections
                </h4>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tavily Search API Key:
                  </label>
                  <input
                    type="password"
                    value={formData.tavilyApiKey}
                    onChange={(e) => setFormData({ ...formData, tavilyApiKey: e.target.value })}
                    placeholder="tvly-..."
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    SerpAPI Key (Optional):
                  </label>
                  <input
                    type="password"
                    value={formData.serpApiKey}
                    onChange={(e) => setFormData({ ...formData, serpApiKey: e.target.value })}
                    placeholder="serp-..."
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Data Source Providers */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> Enabled Data Sources
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(formData.enabledSources).map(([key, val]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#18181f] border border-white/5 cursor-pointer text-gray-200 capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enabledSources: {
                              ...formData.enabledSources,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="accent-indigo-500 rounded"
                      />
                      <span>{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Advanced Actions */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  Danger Zone
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAllSessions) {
                      onClearAllSessions();
                      onClose();
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                  Clear All Research Sessions
                </button>
              </div>

              {/* Footer Submit */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#18181f] border border-white/10 text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg"
                >
                  {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                  <span>{saved ? 'Saved!' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
