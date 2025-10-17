import { DollarSign, Utensils } from "lucide-react";

interface SavingsCardProps {
  savingsPercentage?: number;
  revenueLastWeek?: number;
  foodLastWeek?: number;
}

export function SavingsCard({
  savingsPercentage = 75,
  revenueLastWeek = 4000,
  foodLastWeek = 100,
}: SavingsCardProps) {
  // Calculate stroke dasharray for the circular progress
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (savingsPercentage / 100) * circumference;

  return (
    <div className="w-full bg-gradient-to-br from-[#00D09E] to-[#00B589] rounded-2xl p-2 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Circular Progress Chart */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="#2563EB"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Car icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#0A4A6E] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h8M8 7a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v1a2 2 0 01-2 2M8 7v3m8-3v3m-9 8h10a2 2 0 002-2v-5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2z"
                  />
                  <circle cx="8.5" cy="17.5" r="1.5" fill="currentColor" />
                  <circle cx="15.5" cy="17.5" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-1.5 text-center">
            <p className="text-[#031314] font-bold text-[10px] leading-tight">
              Savings
            </p>
            <p className="text-[#031314] font-bold text-[10px] leading-tight">
              On Goals
            </p>
            <p className="text-[#2563EB] font-bold text-xs mt-0.5">
              {savingsPercentage}%
            </p>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px self-stretch bg-[#031314]/20 flex-shrink-0" />

        {/* Revenue and Food stats */}
        <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
          {/* Revenue Last Week */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#031314]/10 rounded-lg p-2 flex-shrink-0">
              <DollarSign className="w-5 h-5 text-[#031314]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#031314] text-[10px] font-medium leading-tight">
                Revenue Last Week
              </p>
              <p className="text-[#031314] text-lg font-bold truncate leading-tight mt-0.5">
                ${revenueLastWeek.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Divider line */}
          <div className="w-full h-px bg-[#031314]/20" />

          {/* Food Last Week */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#031314]/10 rounded-lg p-2 flex-shrink-0">
              <Utensils className="w-5 h-5 text-[#031314]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#031314] text-[10px] font-medium leading-tight">
                Food Last Week
              </p>
              <p className="text-[#3B82F6] text-lg font-bold truncate leading-tight mt-0.5">
                -${foodLastWeek.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
