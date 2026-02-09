"use client";

import { motion, Variants } from "framer-motion";

interface AnimatedIconProps {
    isSelected: boolean;
    className?: string;
}

const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => {
        const delay = 0.1 + i * 0.15;
        return {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
                opacity: { delay, duration: 0.01 }
            }
        };
    }
};

const StaticIcon = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {children}
    </svg>
);

export const ProductIcon = ({ isSelected, className }: AnimatedIconProps) => {
    if (!isSelected) {
        return (
            <StaticIcon className={className}>
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
            </StaticIcon>
        );
    }

    return (
        <motion.svg
            key="animating"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            initial="hidden"
            animate="visible"
        >
            <motion.rect width="7" height="7" x="3" y="3" rx="1" variants={draw} custom={0} />
            <motion.rect width="7" height="7" x="14" y="3" rx="1" variants={draw} custom={1} />
            <motion.rect width="7" height="7" x="14" y="14" rx="1" variants={draw} custom={2} />
            <motion.rect width="7" height="7" x="3" y="14" rx="1" variants={draw} custom={3} />
        </motion.svg>
    );
};

export const TechIcon = ({ isSelected, className }: AnimatedIconProps) => {
    if (!isSelected) {
        return (
            <StaticIcon className={className}>
                <path d="m18 16 4-4-4-4" />
                <path d="m6 8-4 4 4 4" />
                <path d="m14.5 4-5 16" />
            </StaticIcon>
        );
    }
    return (
        <motion.svg
            key="animating"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            initial="hidden"
            animate="visible"
        >
            <motion.path d="m18 16 4-4-4-4" variants={draw} custom={0} />
            <motion.path d="m6 8-4 4 4 4" variants={draw} custom={1} />
            <motion.path d="m14.5 4-5 16" variants={draw} custom={2} />
        </motion.svg>
    );
};

export const MarketingIcon = ({ isSelected, className }: AnimatedIconProps) => {
    if (!isSelected) {
        return (
            <StaticIcon className={className}>
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </StaticIcon>
        );
    }
    return (
        <motion.svg
            key="animating"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            initial="hidden"
            animate="visible"
        >
            <motion.path d="m3 11 18-5v12L3 14v-3z" variants={draw} custom={0} />
            <motion.path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" variants={draw} custom={1} />
        </motion.svg>
    );
};

export const FinanceIcon = ({ isSelected, className }: AnimatedIconProps) => {
    if (!isSelected) {
        return (
            <StaticIcon className={className}>
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </StaticIcon>
        );
    }
    return (
        <motion.svg
            key="animating"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            initial="hidden"
            animate="visible"
        >
            <motion.path d="M21.21 15.89A10 10 0 1 1 8 2.83" variants={draw} custom={0} />
            <motion.path d="M22 12A10 10 0 0 0 12 2v10z" variants={draw} custom={1} />
        </motion.svg>
    );
};

export const AdvisorIcon = ({ isSelected, className }: AnimatedIconProps) => {
    if (!isSelected) {
        return (
            <StaticIcon className={className}>
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5 0-3.3-2.7-6-6-6s-6 2.7-6 6c0 1.5.5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
            </StaticIcon>
        );
    }
    return (
        <motion.svg
            key="animating"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            initial="hidden"
            animate="visible"
        >
            <motion.path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5 0-3.3-2.7-6-6-6s-6 2.7-6 6c0 1.5.5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5" variants={draw} custom={0} />
            <motion.path d="M9 18h6" variants={draw} custom={1} />
            <motion.path d="M10 22h4" variants={draw} custom={2} />
        </motion.svg>
    );
};
