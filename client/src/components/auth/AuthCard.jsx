import { motion } from 'framer-motion';

export default function AuthCard({ children, className = '' }) {
  return (
      <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`w-full max-w-md mx-auto px-4 ${className}`.trim()}
      >
        <div className="rounded-3xl border border-white/60 bg-white/90 p-8 text-right shadow-2xl backdrop-blur-md">
          {children}
        </div>
      </motion.section>
  );
}