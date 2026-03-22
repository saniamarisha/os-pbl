import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import './LandingPage.css';

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: '🏦',
    title: "Banker's Algorithm",
    desc: 'Simulates resource requests and checks if granting them keeps the system in a safe state. If unsafe — the request is denied to prevent deadlock.',
    color: '#6c5ce7',
  },
  {
    icon: '🔗',
    title: 'Resource Allocation Graph',
    desc: 'Visual directed graph showing which processes hold or wait for resources. DFS-based cycle detection identifies circular waits instantly.',
    color: '#00b894',
  },
  {
    icon: '🛡️',
    title: 'Deadlock Prevention',
    desc: 'By checking every request before granting it, the system guarantees no process will ever freeze waiting for resources held by others.',
    color: '#0984e3',
  },
  {
    icon: '📊',
    title: 'Live Matrix Display',
    desc: 'Real-time Allocation, Maximum, and Need matrices update with every action. See exactly how each process impacts system resources.',
    color: '#fdcb6e',
  },
];

const steps = [
  { num: '01', title: 'Define Resources', desc: 'System starts with processes and their maximum resource claims.' },
  { num: '02', title: 'Request Resources', desc: 'Processes request resources. Each request is validated through Banker\'s Algorithm.' },
  { num: '03', title: 'Safety Check', desc: 'The algorithm simulates granting the request and searches for a safe sequence.' },
  { num: '04', title: 'Grant or Deny', desc: 'If a safe sequence exists → request granted. If not → denied to prevent deadlock.' },
];

const conditions = [
  { icon: '🔒', name: 'Mutual Exclusion', desc: 'Resources are non-shareable' },
  { icon: '✋', name: 'Hold & Wait', desc: 'Process holds one, waits for another' },
  { icon: '🚫', name: 'No Preemption', desc: 'Resources can\'t be forcibly taken' },
  { icon: '🔄', name: 'Circular Wait', desc: 'Circular chain of waiting processes' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="landing">
      {/* ─── Floating Particles Background ─── */}
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * -300 - 100],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              background: ['#6c5ce7', '#00b894', '#0984e3', '#fdcb6e'][i % 4],
            }}
          />
        ))}
      </div>

      {/* ─── Hero Section ─── */}
      <motion.section
        ref={heroRef}
        className="hero"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <motion.div className="hero-badge" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <span className="badge-dot" /> Operating Systems Project
        </motion.div>

        <motion.h1 className="hero-title" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          Preventing Application
          <br />
          <span className="gradient-text">Freezes & Deadlocks</span>
        </motion.h1>

        <motion.p className="hero-subtitle" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          An interactive simulator that demonstrates how operating systems use
          <strong> Banker's Algorithm</strong> and <strong>Resource Allocation Graphs</strong> to
          prevent processes from freezing due to resource deadlocks.
        </motion.p>

        <motion.div className="hero-actions" variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <motion.button
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(108, 92, 231, 0.4)' }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started
            <span className="btn-arrow">→</span>
          </motion.button>
          <motion.a
            className="btn-secondary"
            href="#how-it-works"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Learn More ↓
          </motion.a>
        </motion.div>

        {/* Hero Visual — Animated RAG Preview */}
        <motion.div
          className="hero-visual"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <div className="visual-glow" />
          <svg viewBox="0 0 500 220" className="hero-svg">
            {/* Edges */}
            <motion.line x1="100" y1="80" x2="300" y2="50" stroke="#4ecdc4" strokeWidth="2" opacity="0.6"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }} transition={{ delay: 1.2, duration: 0.8 }} />
            <motion.line x1="100" y1="140" x2="300" y2="170" stroke="#4ecdc4" strokeWidth="2" opacity="0.6"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }} transition={{ delay: 1.4, duration: 0.8 }} />
            <motion.line x1="100" y1="80" x2="300" y2="170" stroke="#ff6b6b" strokeWidth="2" strokeDasharray="6,3" opacity="0.7"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.7 }} transition={{ delay: 1.6, duration: 0.8 }} />
            <motion.line x1="100" y1="140" x2="300" y2="50" stroke="#ff6b6b" strokeWidth="2" strokeDasharray="6,3" opacity="0.7"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.7 }} transition={{ delay: 1.8, duration: 0.8 }} />

            {/* Process nodes */}
            <motion.circle cx="100" cy="80" r="28" fill="rgba(108,92,231,0.25)" stroke="#6c5ce7" strokeWidth="2"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} />
            <text x="100" y="85" textAnchor="middle" fill="white" fontWeight="700" fontSize="14">P0</text>
            <motion.circle cx="100" cy="140" r="28" fill="rgba(108,92,231,0.25)" stroke="#6c5ce7" strokeWidth="2"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} />
            <text x="100" y="145" textAnchor="middle" fill="white" fontWeight="700" fontSize="14">P1</text>

            {/* Resource nodes */}
            <motion.rect x="276" y="30" width="48" height="40" rx="8" fill="rgba(0,184,148,0.2)" stroke="#00b894" strokeWidth="2"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: 'spring' }} />
            <text x="300" y="55" textAnchor="middle" fill="white" fontWeight="700" fontSize="14">R0</text>
            <motion.rect x="276" y="150" width="48" height="40" rx="8" fill="rgba(0,184,148,0.2)" stroke="#00b894" strokeWidth="2"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0, type: 'spring' }} />
            <text x="300" y="175" textAnchor="middle" fill="white" fontWeight="700" fontSize="14">R1</text>

            {/* Label */}
            <motion.text x="410" y="85" fill="#ff6b6b" fontSize="12" fontWeight="600" opacity="0"
              animate={{ opacity: [0, 1, 0.7, 1] }} transition={{ delay: 2.2, duration: 1.5 }}>
              ⚠ Cycle
            </motion.text>
            <motion.text x="400" y="105" fill="#ff6b6b" fontSize="12" fontWeight="600" opacity="0"
              animate={{ opacity: [0, 1, 0.7, 1] }} transition={{ delay: 2.4, duration: 1.5 }}>
              Detected!
            </motion.text>

            {/* Safe badge */}
            <motion.rect x="380" y="140" width="100" height="36" rx="18" fill="rgba(0,184,148,0.15)" stroke="#00b894" strokeWidth="1.5"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.6, duration: 0.6 }} />
            <motion.text x="430" y="163" textAnchor="middle" fill="#00b894" fontSize="12" fontWeight="700"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
              ✅ SAFE
            </motion.text>
          </svg>
        </motion.div>
      </motion.section>

      {/* ─── Deadlock Conditions ─── */}
      <section className="section conditions-section">
        <motion.div
          className="section-header"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          custom={0}
        >
          <span className="section-tag">The Problem</span>
          <h2>4 Conditions That Cause Deadlock</h2>
          <p>All four must be present simultaneously for a deadlock to occur.</p>
        </motion.div>

        <motion.div
          className="conditions-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {conditions.map((c, i) => (
            <motion.div key={c.name} className="condition-card" variants={scaleIn} custom={i}>
              <span className="condition-icon">{c.icon}</span>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
              <span className="condition-num">{i + 1}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="section how-section">
        <motion.div
          className="section-header"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          custom={0}
        >
          <span className="section-tag">How It Works</span>
          <h2>Banker's Algorithm in Action</h2>
          <p>A step-by-step deadlock avoidance strategy used by operating systems.</p>
        </motion.div>

        <div className="steps-timeline">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="step-card"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              custom={i}
            >
              <div className="step-num">{step.num}</div>
              <div className="step-connector" />
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="section features-section">
        <motion.div
          className="section-header"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          custom={0}
        >
          <span className="section-tag">Features</span>
          <h2>What's Inside the Simulator</h2>
          <p>A complete toolkit for understanding and preventing deadlocks.</p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              variants={scaleIn}
              custom={i}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="feature-icon-wrap" style={{ background: `${f.color}18`, borderColor: `${f.color}40` }}>
                <span className="feature-icon">{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="feature-glow" style={{ background: f.color }} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="section cta-section">
        <motion.div
          className="cta-card"
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
        >
          <div className="cta-glow" />
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            Ready to Simulate?
          </motion.h2>
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}>
            Launch the interactive dashboard to experiment with resource allocation,
            test the Banker's Algorithm, and visualize deadlock scenarios in real time.
          </motion.p>
          <motion.button
            className="btn-primary btn-large"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(108, 92, 231, 0.5)' }}
            whileTap={{ scale: 0.97 }}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
          >
            Launch Dashboard
            <span className="btn-arrow">→</span>
          </motion.button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <p>OS PBL — Preventing Application Freezes Caused by Resource Deadlocks</p>
      </footer>
    </div>
  );
}
