/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Inbox,
  Bot,
  FileText,
  Database,
  Table,
  BrainCircuit,
  Mail,
  Warehouse,
  XCircle,
  CheckCircle2,
  Play,
  History,
  Activity,
  ArrowRight,
  FileUp,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogEntry {
  step: string;
  status: string;
  detail: string;
}

interface WebhookResponse {
  success: boolean;
  decision: string;
  reason: string;
  logs: LogEntry[];
  data: any;
}

export default function App() {
  const [email, setEmail] = useState('customer@example.com');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<WebhookResponse | null>(null);
  const [history, setHistory] = useState<WebhookResponse[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerWebhook = async () => {
    if (!selectedFile) {
      alert('Please upload a PDF Purchase Order first.');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // ── Step 1: Upload PDF to backend → Gemini extracts SKU & quantity ──────
      setExtractionStatus('Extracting data from PDF using Gemini (server-side)...');

      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!extractRes.ok) {
        const err = await extractRes.text();
        throw new Error(`Extraction failed (${extractRes.status}): ${err}`);
      }

      const { extractedData } = await extractRes.json();

      // ── Step 2: Run fulfillment decision logic on the backend ───────────────
      setExtractionStatus('Running fulfillment logic...');

      const webhookRes = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, extractedData }),
      });

      if (!webhookRes.ok) {
        const err = await webhookRes.text();
        throw new Error(`Webhook error (${webhookRes.status}): ${err}`);
      }

      const data = await webhookRes.json();
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 5));
    } catch (error: any) {
      console.error('Agent error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setExtractionStatus('');
    }
  };

  const getStepIcon = (step: string) => {
    if (step.includes("Inbox")) return <Inbox size={18} />;
    if (step.includes("PDF")) return <FileText size={18} />;
    if (step.includes("Salesforce")) return <Database size={18} />;
    if (step.includes("Sheets")) return <Table size={18} />;
    if (step.includes("Approval Email")) return <Mail size={18} />;
    if (step.includes("Reject Email")) return <XCircle size={18} />;
    return <Activity size={18} />;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">OrderBot Agent v2.0</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Dynamic Fulfillment Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Agent Online
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Simulation */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Play size={16} className="text-indigo-400" />
              Trigger Webhook
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Customer Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2">Upload Purchase Order (PDF)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    selectedFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="text-indigo-400" size={32} />
                      <p className="text-xs font-medium text-zinc-300 truncate max-w-[200px]">{selectedFile.name}</p>
                      <button className="text-[10px] text-zinc-500 hover:text-zinc-300 underline">Change File</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileUp className="text-zinc-600" size={32} />
                      <p className="text-xs text-zinc-500">Click to upload PO PDF</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={triggerWebhook}
                disabled={isProcessing || !selectedFile}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Process Purchase Order
                  </>
                )}
              </button>
              {extractionStatus && <p className="text-[10px] text-indigo-400 text-center animate-pulse">{extractionStatus}</p>}
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <History size={16} className="text-purple-400" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {history.length === 0 && <p className="text-xs text-zinc-600 italic">No recent runs...</p>}
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    {h.decision === 'APPROVE' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-rose-400" />}
                    <span className="text-xs font-medium">{h.data.customer?.name || 'Unknown'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${h.decision === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {h.decision}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Workflow Visualization */}
        <div className="lg:col-span-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl min-h-[600px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BrainCircuit size={200} />
            </div>

            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-10 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" />
              Live Workflow Execution
            </h2>

            {!result && !isProcessing && (
              <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                  <BrainCircuit size={32} />
                </div>
                <p className="text-zinc-500 text-sm max-w-xs">Upload your own PDF Purchase Order and trigger the agent to see dynamic extraction and fulfillment logic.</p>
              </div>
            )}

            {(isProcessing || result) && (
              <div className="space-y-4 relative">
                {/* Connection Line */}
                <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-zinc-800" />

                <AnimatePresence mode="popLayout">
                  {(result?.logs || []).map((log, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative flex items-start gap-6 group"
                    >
                      <div className={`z-10 w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all ${
                        log.status === 'Success' 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:border-indigo-500/50'
                      }`}>
                        {getStepIcon(log.step)}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-zinc-200">{log.step}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${log.status === 'Success' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">{log.detail}</p>
                      </div>
                    </motion.div>
                  ))}

                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`mt-10 p-6 rounded-2xl border-2 ${
                        result.decision === 'APPROVE' 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-rose-500/5 border-rose-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          result.decision === 'APPROVE' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {result.decision === 'APPROVE' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">Order {result.decision}D</h4>
                          <p className="text-xs text-zinc-500">{result.reason || 'All validation checks passed successfully.'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
                          <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Customer</p>
                          <p className="text-xs font-medium truncate">{result.data.customer?.name || 'N/A'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
                          <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Extracted SKU</p>
                          <p className="text-xs font-medium">{result.data.extractedData.sku}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
                          <p className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Stock Level</p>
                          <p className="text-xs font-medium">{result.data.stockInfo.stock} units</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer / Flow Diagram Reference */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-6 text-xs font-semibold tracking-widest uppercase">
            <span>PDF Upload</span>
            <ArrowRight size={14} />
            <span>Gemini Extraction</span>
            <ArrowRight size={14} />
            <span>Dynamic DB Lookup</span>
            <ArrowRight size={14} />
            <span>Fulfillment Action</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database size={14} />
              <span className="text-[10px]">Firestore</span>
            </div>
            <div className="flex items-center gap-2">
              <BrainCircuit size={14} />
              <span className="text-[10px]">Gemini 2.0 Flash</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
