pub struct Memory {
    storage: Vec<u8>,
}

impl Memory {
    pub fn new(size: usize) -> Self {
        Memory { storage: vec![0; size] }
    }

    pub fn write_byte(&mut self, addr: u32, val: u8) -> Result<(), String> {
        let addr = addr as usize;
        if addr >= self.storage.len() {
            return Err(format!("Memory write violation at 0x{:08X}", addr));
        }
        self.storage[addr] = val;
        Ok(())
    }

    pub fn read_byte(&self, addr: u32) -> Result<u8, String> {
        let addr = addr as usize;
        if addr >= self.storage.len() {
            return Err(format!("Memory read violation at 0x{:08X}", addr));
        }
        Ok(self.storage[addr])
    }

    pub fn write_word(&mut self, addr: u32, val: u32) -> Result<(), String> {
        if addr % 4 != 0 {
            return Err(format!("Unaligned word write at 0x{:08X}", addr));
        }
        let bytes = val.to_le_bytes();
        for (i, &b) in bytes.iter().enumerate() {
            self.write_byte(addr + i as u32, b)?;
        }
        Ok(())
    }

    pub fn read_word(&self, addr: u32) -> Result<u32, String> {
        if addr % 4 != 0 {
            return Err(format!("Unaligned word read at 0x{:08X}", addr));
        }
        let mut bytes = [0u8; 4];
        for i in 0..4 {
            bytes[i] = self.read_byte(addr + i as u32)?;
        }
        Ok(u32::from_le_bytes(bytes))
    }

    pub fn get_sample(&self, size: usize) -> Vec<u8> {
        self.storage[0..std::cmp::min(size, self.storage.len())].to_vec()
    }

    pub fn reset(&mut self) {
        self.storage.fill(0);
    }
}
