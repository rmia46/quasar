import React from 'react';

interface RegisterViewProps {
  registers: number[];
  fp_registers: number[];
  changedIndices: number[];
  changedFPIndices: number[];
  hi: number;
  lo: number;
  hiLoChanged: { hi: boolean; lo: boolean };
  view: 'core' | 'cp1';
}

const REGISTER_NAMES = [
  '$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3',
  '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
  '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
  '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'
];

const RegisterView: React.FC<RegisterViewProps> = React.memo(({ 
  registers, 
  fp_registers = [], 
  changedIndices, 
  changedFPIndices,
  hi, 
  lo, 
  hiLoChanged,
  view 
}) => {
  if (view === 'cp1') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)] opacity-60 px-2 py-1 mb-2 border-b border-[var(--border)] pb-2">
          Coprocessor 1 (FPU)
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center text-[9px] font-bold uppercase tracking-widest text-[var(--app-foreground)] opacity-30 px-2 py-1 border-b border-[var(--border)] mb-1">
              <span className="w-16">Name</span>
              <span className="flex-1 text-center">Hex</span>
              <span className="w-20 text-right">Float</span>
            </div>
            {new Array(32).fill(0).map((_, i) => {
              const bits = fp_registers[i] || 0;
              const hex = bits.toString(16).padStart(8, '0').toUpperCase();
              const isChanged = changedFPIndices.includes(i);
              
              // Helper to convert bits to float for display
              const floatBuffer = new Float32Array(new Uint32Array([bits]).buffer);
              const floatVal = floatBuffer[0];

              return (
                <div key={`f${i}`} className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-all duration-500
                  ${isChanged ? 'bg-orange-500/20 shadow-[inset_0_0_8px_rgba(254,148,66,0.1)]' : 'hover:bg-[var(--tab-active)]'}`}
                >
                  <span className={`w-16 text-xs font-mono font-bold ${isChanged ? 'text-orange-500' : 'text-[var(--accent)]'}`}>$f{i}</span>
                  <span className="flex-1 text-center text-xs font-mono text-[var(--app-foreground)] opacity-80">0x{hex}</span>
                  <span className={`w-20 text-right text-[11px] font-mono ${isChanged ? 'text-orange-500' : 'text-blue-400'}`}>
                    {floatVal.toFixed(4).replace(/\.?0+$/, '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Special Purpose Section */}
        <div className="mb-4">
          <div className="flex items-center text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)] opacity-60 px-2 py-1 mb-1 border-b border-[var(--border)] pb-2">
            Special Purpose
          </div>
          <div className="grid grid-cols-1 gap-1 mt-2">
            {[
              { name: 'HI', val: hi, isChanged: hiLoChanged.hi },
              { name: 'LO', val: lo, isChanged: hiLoChanged.lo }
            ].map(reg => (
              <div 
                key={reg.name} 
                className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-all duration-500
                  ${reg.isChanged ? 'bg-orange-500/20 shadow-[inset_0_0_8px_rgba(254,148,66,0.1)]' : 'hover:bg-[var(--tab-active)]'}`}
              >
                <span className={`w-16 text-xs font-mono font-bold text-[var(--accent)]`}>{reg.name}</span>
                <span className="flex-1 text-center text-xs font-mono text-[var(--app-foreground)] opacity-80">
                  0x{reg.val.toString(16).padStart(8, '0').toUpperCase()}
                </span>
                <span className={`w-20 text-right text-[11px] font-mono ${(reg.val | 0) < 0 ? 'text-red-500' : 'text-green-500'} opacity-90`}>
                  {reg.val | 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* General Purpose Section */}
        <div>
          <div className="flex items-center text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)] opacity-60 px-2 py-1 mb-1 border-b border-[var(--border)] pb-2">
            General Purpose
          </div>
          <div className="grid grid-cols-1 gap-1 mt-2">
            <div className="flex items-center text-[9px] font-bold uppercase tracking-widest text-[var(--app-foreground)] opacity-30 px-2 py-1 border-b border-[var(--border)] mb-1">
              <span className="w-16">Name</span>
              <span className="flex-1 text-center">Hex</span>
              <span className="w-20 text-right">Decimal</span>
            </div>
            {REGISTER_NAMES.map((name, index) => {
              const val = registers[index] || 0;
              const hex = val.toString(16).padStart(8, '0').toUpperCase();
              const dec = (val | 0);
              const isChanged = changedIndices.includes(index);
              
              return (
                <div 
                  key={name} 
                  className={`flex items-center justify-between py-1 px-2 rounded-md transition-all duration-500
                    ${isChanged ? 'bg-orange-500/20 shadow-[inset_0_0_8px_rgba(254,148,66,0.1)]' : 'hover:bg-[var(--tab-active)]'}`}
                >
                  <span className={`w-16 text-xs font-mono font-medium ${isChanged ? 'text-orange-500' : 'text-[var(--app-foreground)] opacity-70'}`}>{name}</span>
                  <span className="flex-1 text-center text-xs font-mono text-[var(--app-foreground)] opacity-80">
                    0x{hex}
                  </span>
                  <span className={`w-20 text-right text-[11px] font-mono ${dec < 0 ? 'text-red-500' : 'text-green-500'} opacity-90`}>
                    {dec}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default RegisterView;
