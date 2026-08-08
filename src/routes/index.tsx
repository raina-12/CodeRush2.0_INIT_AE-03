import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import { 
  Layers, ArrowRight, Play, Sparkles, Bot, Cpu, 
  CheckCircle2, ShieldCheck, Workflow, Search, 
  FileText, Compass, ChevronRight, Terminal, Activity
} from 'lucide-react';
import { motion } from 'motion/react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const workflowSteps = [
    {
      title: 'Task Understanding',
      desc: 'Parses complex natural language intents and extracts key constraints from context and uploaded documents.',
      icon: Search,
      agent: 'Document Agent'
    },
    {
      title: 'Planning',
      desc: 'Deconstructs high-level objectives into an optimized Directed Acyclic Graph (DAG) with execution priorities.',
      icon: Compass,
      agent: 'Planner Agent'
    },
    {
      title: 'Agent Selection',
      desc: 'Dynamically selects specialized autonomous agents based on task complexity, domain knowledge, and required tools.',
      icon: Bot,
      agent: 'Orchestrator'
    },
    {
      title: 'Workflow',
      desc: 'Generates real-time visual execution graphs with strict input/output contracts between nodes.',
      icon: Workflow,
      agent: 'Graph Engine'
    },
    {
      title: 'Execution',
      desc: 'Runs concurrent agent loops in isolated sandboxes with streaming data pipelines and tool integration.',
      icon: Cpu,
      agent: 'Execution Pool'
    },
    {
      title: 'Verification',
      desc: 'Audits output accuracy, verifies constraint fulfillment, and synthesizes clean, actionable results.',
      icon: ShieldCheck,
      agent: 'Auditor Agent'
    }
  ];

  const features = [
    {
      title: 'Natural Language to DAG',
      desc: 'Convert any multi-step prompt into a structured, executable node-graph automatically.',
      icon: Terminal
    },
    {
      title: 'Multi-Agent Orchestration',
      desc: 'Combine Document Readers, Web Researchers, and Sandbox Code Executors seamlessly.',
      icon: Layers
    },
    {
      title: 'Real-Time Verification',
      desc: 'Self-correcting verification loops prevent hallucination and guarantee result precision.',
      icon: CheckCircle2
    },
    {
      title: 'Context File Ingestion',
      desc: 'Upload PDF, DOCX, and TXT files directly into agent memory buffers for deep analysis.',
      icon: FileText
    }
  ];

  return (
    <div className="min-h-screen bg-[#020205] text-[#e0e0e6] font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative">
      {/* Immersive Ambient Glow Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
      </div>

      {/* Header / Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-md h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div 
            onClick={() => navigate({ to: '/' })}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold tracking-tight text-xl text-white uppercase group-hover:text-cyan-300 transition-colors">
                ORQUESTRA
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full ml-2">
                AGENTIC
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-10 text-sm font-medium text-white/60">
            <a href="#home" className="hover:text-cyan-400 transition-colors">Home</a>
            <a href="#pipeline" className="hover:text-cyan-400 transition-colors">Pipeline</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate({ to: '/login' })}
              className="text-sm font-semibold text-white/80 hover:text-white px-4 py-2 transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => navigate({ to: '/signup' })}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 hover:shadow-cyan-500/35 transition-all text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10 pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Turn intent into intelligent workflows.</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]"
          >
            An agentic AI system that turns{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              natural-language tasks
            </span>{' '}
            into dynamic workflows.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed"
          >
            ORQUESTRA automatically breaks down complex objectives into multi-agent execution graphs, selecting specialized tools to execute and verify outcomes.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate({ to: '/signup' })}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/25 hover:scale-105 hover:shadow-cyan-500/40 transition-all text-sm flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate({ to: '/login' })}
              className="w-full sm:w-auto px-8 py-4 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-white transition-all text-sm backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Sign In</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Workflow Explanation Section */}
      <section id="pipeline" className="relative z-10 py-20 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
              THE AGENTIC CYCLE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Task Understanding → Planning → Agent Selection → Workflow → Execution → Verification
            </h2>
            <p className="text-xs sm:text-sm text-white/50">
              How ORQUESTRA converts raw text prompts into guaranteed verifiable workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 transition-all backdrop-blur-sm hover:shadow-[0_0_25px_rgba(34,211,238,0.1)] group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-white/30">STAGE 0{idx + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">{step.desc}</p>
                  <div className="text-[11px] font-mono text-cyan-400/90 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-white/30">Handler:</span>
                    <span className="font-semibold text-cyan-400">{step.agent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em]">
              CORE CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Built for Autonomous Task Orchestration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-colors backdrop-blur-sm">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-4">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 py-20 border-t border-white/5 bg-gradient-to-b from-[#020205] to-black">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to turn intent into intelligent workflows?
          </h2>
          <p className="text-sm text-white/50">
            Join developers and researchers using ORQUESTRA to automate multi-agent task pipelines.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <button
              onClick={() => navigate({ to: '/signup' })}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/25 hover:scale-105 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 bg-black/60 text-xs text-white/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white">ORQUESTRA</span>
            <span>— Turn intent into intelligent workflows.</span>
          </div>
          <div className="flex items-center space-x-6 text-white/60">
            <button onClick={() => navigate({ to: '/' })} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => navigate({ to: '/login' })} className="hover:text-white transition-colors cursor-pointer">Login</button>
            <button onClick={() => navigate({ to: '/signup' })} className="hover:text-white transition-colors cursor-pointer">Sign Up</button>
          </div>
        </div>
      </footer>
    </div>
  );
}