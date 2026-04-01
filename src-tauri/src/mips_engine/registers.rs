pub struct RegisterFile {
    pub gpr: [u32; 32],
    pub fpr: [f32; 32], // Floating point registers
    pub hi: u32,
    pub lo: u32,
}

impl RegisterFile {
    pub fn new() -> Self {
        RegisterFile {
            gpr: [0; 32],
            fpr: [0.0; 32],
            hi: 0,
            lo: 0,
        }
    }

    pub fn read(&self, index: usize) -> u32 {
        if index == 0 { return 0; }
        self.gpr[index]
    }

    pub fn write(&mut self, index: usize, value: u32) {
        if index == 0 { return; }
        self.gpr[index] = value;
    }

    pub fn read_fp(&self, index: usize) -> f32 {
        self.fpr[index]
    }

    pub fn write_fp(&mut self, index: usize, value: f32) {
        self.fpr[index] = value;
    }

    pub fn reset(&mut self) {
        self.gpr = [0; 32];
        self.fpr = [0.0; 32];
        self.hi = 0;
        self.lo = 0;
    }

    pub fn get_all(&self) -> [u32; 32] {
        self.gpr
    }
}
