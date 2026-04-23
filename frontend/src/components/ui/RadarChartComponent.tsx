"use client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

const LABELS: Record<string, string> = {
  emotional_impact: "Emotional",
  cinematography: "Visuals",
  audio_design: "Audio",
  narrative_coherence: "Narrative",
  moral_conflict: "Morality",
  thematic_depth: "Themes",
  pacing: "Pacing",
  rewatch_value: "Rewatch",
};

interface Datum { dimension: string; userA: number; userB?: number; fullMark: number; }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 rounded-sm text-sm"
      style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}
    >
      <div className="text-[0.65rem] tracking-widest uppercase mb-2" style={{ color: "var(--white3)" }}>
        {LABELS[payload[0].payload.dimension] ?? payload[0].payload.dimension}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span style={{ color: "var(--white2)" }} className="text-[0.75rem]">{p.name}</span>
          <span className="font-bold ml-auto pl-4" style={{ color: p.color }}>{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export default function RadarChartComponent({
  data, mode, userAName = "You", userBName = "Partner"
}: { data: Datum[]; mode: "single" | "match"; userAName?: string; userBName?: string }) {
  const formatted = data.map(d => ({ ...d, label: LABELS[d.dimension] ?? d.dimension }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={formatted}>
        <PolarGrid
          stroke="rgba(255,255,255,0.06)"
          gridType="polygon"
        />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fill: "rgba(176,176,172,0.75)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}
          tickLine={false}
        />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />

        <Radar
          name={userAName}
          dataKey="userA"
          stroke="#e8392a"
          fill="#e8392a"
          fillOpacity={0.18}
          strokeWidth={2}
          dot={{ fill: "#e8392a", r: 3 }}
          isAnimationActive
          animationDuration={1200}
          animationEasing="ease-out"
        />
        {mode === "match" && (
          <Radar
            name={userBName}
            dataKey="userB"
            stroke="rgba(240,240,238,0.75)"
            fill="rgba(240,240,238,0.75)"
            fillOpacity={0.1}
            strokeWidth={1.5}
            dot={{ fill: "#f0f0ee", r: 2 }}
            isAnimationActive
            animationDuration={1400}
            animationEasing="ease-out"
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
