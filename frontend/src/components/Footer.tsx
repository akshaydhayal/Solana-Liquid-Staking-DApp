import { ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <div className="mt-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-4">
            <a href="#" className="hover:text-purple-400 transition-colors flex items-center gap-1">Documentation <ExternalLink size={14} /></a>
            <span className="text-gray-600">•</span>
            <a href="#" className="hover:text-blue-400 transition-colors flex items-center gap-1">Analytics <ExternalLink size={14} /></a>
            <span className="text-gray-600">•</span>
            <a href="#" className="hover:text-cyan-400 transition-colors">Security Audit</a>
        </div>
    </div>
  )
}

export default Footer