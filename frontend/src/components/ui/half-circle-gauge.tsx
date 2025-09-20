'use client';

interface HalfCircleGaugeProps {
	value: number;
	max?: number;
	label: string;
	color?: string;
	size?: number;
}

export function HalfCircleGauge({
	value,
	max = 100,
	label,
	color = '#3b82f6',
	size = 120,
}: HalfCircleGaugeProps) {
	const percentage = Math.min((value / max) * 100, 100);
	const strokeWidth = 8;
	const radius = (size - strokeWidth) / 2;
	const circumference = Math.PI * radius;
	const strokeDasharray = circumference;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	return (
		<div className="flex flex-col items-center">
			<div
				className="relative"
				style={{ width: size, height: size / 2 + 20 }}
			>
				<svg
					width={size}
					height={size / 2 + 20}
					className="transform -rotate-0"
					style={{ overflow: 'visible' }}
				>
					{/* Background arc */}
					<path
						d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
							size - strokeWidth / 2
						} ${size / 2}`}
						fill="none"
						stroke="#e5e7eb"
						strokeWidth={strokeWidth}
						strokeLinecap="round"
					/>
					{/* Progress arc */}
					<path
						d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
							size - strokeWidth / 2
						} ${size / 2}`}
						fill="none"
						stroke={color}
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						strokeDasharray={strokeDasharray}
						strokeDashoffset={strokeDashoffset}
						className="transition-all duration-1000 ease-out"
					/>
				</svg>
				{/* Center value */}
				<div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
					<span
						className="text-2xl font-bold"
						style={{ color }}
					>
						{value}
					</span>
					<span className="text-xs text-muted-foreground">/ {max}</span>
				</div>
			</div>
			<span className="text-sm font-medium text-center mt-2">{label}</span>
		</div>
	);
}
