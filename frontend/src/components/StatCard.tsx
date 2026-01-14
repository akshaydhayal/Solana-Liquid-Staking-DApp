import type { LucideProps } from "lucide-react";
import * as react from "react";

const StatCard = ({ label, value, subtext, icon: Icon, gradient }:{label:string, subtext?:string, gradient:string, value:string, icon:react.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & react.RefAttributes<SVGSVGElement>>})=>{
    // Determine color based on label
    let borderColor = "border-purple-500/30";
    let iconColor = "text-purple-400";
    let shadowColor = "shadow-purple-500/10";
    
    if (label.includes("TVL") || label.includes("Supply")) {
        borderColor = "border-purple-500/30";
        iconColor = "text-purple-400";
        shadowColor = "shadow-purple-500/10";
    } else if (label.includes("APY")) {
        borderColor = "border-blue-500/30";
        iconColor = "text-blue-400";
        shadowColor = "shadow-blue-500/10";
    } else if (label.includes("Exchange")) {
        borderColor = "border-green-500/30";
        iconColor = "text-green-400";
        shadowColor = "shadow-green-500/10";
    }
    
    return (
    <div className={`bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm border-2 ${borderColor} ${gradient} px-4 py-3 rounded-xl shadow-lg ${shadowColor}`}>
        <div className="flex items-start justify-between mb-1">
            <span className="text-gray-300 text-xs font-medium">{label}</span>
            <Icon size={16} className={iconColor} />
        </div>
        <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
        {subtext && <div className="text-gray-400 text-xs">{subtext}</div>}
    </div>
    );
};

export default StatCard;

