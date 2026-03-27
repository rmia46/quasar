import React from 'react';

interface RegisterViewProps {
  registers: number[];
}

const REGISTER_NAMES = [
  '$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3',
  '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
  '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
  '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'
];

const RegisterView: React.FC<RegisterViewProps> = ({ registers }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111111] rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
      <div className="bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2 border-b border-gray-200 dark:border-[#2a2a2a]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-400">Registers</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {REGISTER_NAMES.map((name, index) => (
            <div key={name} className="flex items-center justify-between py-1 px-2 border-b border-gray-100 dark:border-[#1e1e1e] last:border-0">
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-medium">{name}</span>
              <span className="text-xs font-mono text-gray-800 dark:text-gray-300">
                {registers[index]?.toString(16).padStart(8, '0').toUpperCase() || '00000000'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
