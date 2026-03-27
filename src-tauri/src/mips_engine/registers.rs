use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct RegisterFile {
    values: [u32; 32],
}

impl RegisterFile {
    pub fn new() -> Self {
        RegisterFile { values: [0; 32] }
    }

    pub fn read(&self, index: usize) -> u32 {
        if index == 0 { return 0; }
        self.values[index]
    }

    pub fn write(&mut self, index: usize, value: u32) {
        if index != 0 && index < 32 {
            self.values[index] = value;
        }
    }

    pub fn get_all(&self) -> [u32; 32] {
        self.values
    }

    pub fn reset(&mut self) {
        self.values = [0; 32];
    }
}
