import { motion } from 'framer-motion';


export default function AuthCard({ children, className = '' }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`mx-auto w-full max-w-md px-4 ${className}`.trim()}
        >
            <div className={UI_CLASSES.card}>
                {children}
            </div>
        </motion.section>
    );
}