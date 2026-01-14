import type { LucideProps } from "lucide-react";
import * as react from "react";

const StatCard = ({ label, value, subtext, icon: Icon, gradient }:{label:string, subtext?:string, gradient:string, value:string, icon:react.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & react.RefAttributes<SVGSVGElement>>})=>(
    <div className={`bg-gradient-to-br ${gradient} px-4 py-3 rounded-xl shadow-lg`}>
        <div className="flex items-start justify-between mb-1">
            <span className="text-white/80 text-xs font-medium">{label}</span>
            <Icon size={16} className="text-white/60" />
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
        {subtext && <div className="text-white/70 text-xs">{subtext}</div>}
    </div>
);

export default StatCard;

