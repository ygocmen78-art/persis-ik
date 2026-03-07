export function LogoIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="p-loop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff5555" />
                    <stop offset="40%" stopColor="#ee0000" />
                    <stop offset="100%" stopColor="#990000" />
                </linearGradient>
                <linearGradient id="p-stem-grad" x1="0%" y1="20%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#550000" />
                    <stop offset="40%" stopColor="#aa0000" />
                    <stop offset="100%" stopColor="#cc0000" />
                </linearGradient>
                <filter id="p-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
                </filter>
            </defs>
            <g>
                {/* STEM (Background) */}
                <path d="M 30 20 L 46 25 L 46 90 L 30 85 Z" fill="url(#p-stem-grad)" />

                {/* LOOP (Foreground with shadow) */}
                <path d="M 30 20 
                         L 60 29 
                         C 85 35, 85 67, 60 73 
                         L 30 64 
                         L 30 48 
                         L 60 57 
                         C 68 55, 68 47, 60 45 
                         L 30 36 
                         Z"
                    fill="url(#p-loop-grad)" filter="url(#p-shadow)" stroke="url(#p-loop-grad)" strokeWidth="1" strokeLinejoin="round" />
            </g>
        </svg >
    )
}
