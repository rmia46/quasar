pub mod registers;
pub mod memory;
pub mod instructions;
pub mod parser;
#[cfg(test)]
mod tests;

pub use registers::RegisterFile;
pub use memory::Memory;
pub use instructions::MipsInstruction;
pub use parser::Parser;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SimulatorState {
    pub registers: [u32; 32],
    pub hi: u32,
    pub lo: u32,
    pub pc: u32,
    pub current_line: Option<u32>, // The source line number (1-based)
    pub memory_sample: Vec<u8>,
    pub message: String,
}

pub struct MipsEngine {
    registers: RegisterFile,
    memory: Memory,
    pc: u32,
    program: Vec<MipsInstruction>,
    labels: HashMap<String, u32>,
    // Maps instruction index to original source line number
    instruction_to_line: Vec<u32>,
    is_halted: bool,
    output_buffer: String,
}

impl MipsEngine {
    pub fn new() -> Self {
        MipsEngine {
            registers: RegisterFile::new(),
            memory: Memory::new(1024 * 64),
            pc: 0,
            program: Vec::new(),
            labels: HashMap::new(),
            instruction_to_line: Vec::new(),
            is_halted: false,
            output_buffer: String::new(),
        }
    }

    pub fn load_program(&mut self, assembly: &str) -> Result<(), String> {
        self.reset();
        let mut instructions = Vec::new();
        let mut line_mappings = Vec::new();
        let mut temp_labels = HashMap::new();
        let mut instruction_index = 0;

        for (zero_based_line, raw_line) in assembly.lines().enumerate() {
            let line_num = (zero_based_line + 1) as u32;
            let line = raw_line.split('#').next().unwrap_or("").trim();
            
            if line.is_empty() { continue; }

            if line.ends_with(':') {
                let label = line[..line.len()-1].to_string();
                temp_labels.insert(label, instruction_index);
            } else {
                match Parser::parse_line(line) {
                    Ok(Some(inst)) => {
                        instructions.push(inst);
                        line_mappings.push(line_num);
                        instruction_index += 1;
                    },
                    Ok(None) => {},
                    Err(e) => return Err(format!("Line {}: {}", line_num, e)),
                }
            }
        }

        self.program = instructions;
        self.labels = temp_labels;
        self.instruction_to_line = line_mappings;
        Ok(())
    }

    pub fn step(&mut self) -> Result<bool, String> {
        if self.is_halted || self.pc as usize >= self.program.len() {
            return Ok(false);
        }

        let inst = self.program[self.pc as usize].clone();
        let mut next_pc = self.pc + 1;

        match inst {
            // Arithmetic R-Type
            MipsInstruction::Add { rd, rs, rt } => {
                let val = (self.registers.read(rs) as i32).wrapping_add(self.registers.read(rt) as i32);
                self.registers.write(rd, val as u32);
            },
            MipsInstruction::Addu { rd, rs, rt } => {
                let val = self.registers.read(rs).wrapping_add(self.registers.read(rt));
                self.registers.write(rd, val);
            },
            MipsInstruction::Sub { rd, rs, rt } => {
                let val = (self.registers.read(rs) as i32).wrapping_sub(self.registers.read(rt) as i32);
                self.registers.write(rd, val as u32);
            },
            MipsInstruction::Subu { rd, rs, rt } => {
                let val = self.registers.read(rs).wrapping_sub(self.registers.read(rt));
                self.registers.write(rd, val);
            },
            MipsInstruction::And { rd, rs, rt } => {
                let val = self.registers.read(rs) & self.registers.read(rt);
                self.registers.write(rd, val);
            },
            MipsInstruction::Or { rd, rs, rt } => {
                let val = self.registers.read(rs) | self.registers.read(rt);
                self.registers.write(rd, val);
            },
            MipsInstruction::Xor { rd, rs, rt } => {
                let val = self.registers.read(rs) ^ self.registers.read(rt);
                self.registers.write(rd, val);
            },
            MipsInstruction::Nor { rd, rs, rt } => {
                let val = !(self.registers.read(rs) | self.registers.read(rt));
                self.registers.write(rd, val);
            },
            MipsInstruction::Slt { rd, rs, rt } => {
                let val = if (self.registers.read(rs) as i32) < (self.registers.read(rt) as i32) { 1 } else { 0 };
                self.registers.write(rd, val);
            },
            MipsInstruction::Sltu { rd, rs, rt } => {
                let val = if self.registers.read(rs) < self.registers.read(rt) { 1 } else { 0 };
                self.registers.write(rd, val);
            },

            // Shifts
            MipsInstruction::Sll { rd, rt, sa } => {
                self.registers.write(rd, self.registers.read(rt) << sa);
            },
            MipsInstruction::Srl { rd, rt, sa } => {
                self.registers.write(rd, self.registers.read(rt) >> sa);
            },
            MipsInstruction::Sra { rd, rt, sa } => {
                self.registers.write(rd, ((self.registers.read(rt) as i32) >> sa) as u32);
            },
            MipsInstruction::Sllv { rd, rt, rs } => {
                let sa = self.registers.read(rs) & 0x1F;
                self.registers.write(rd, self.registers.read(rt) << sa);
            },
            MipsInstruction::Srlv { rd, rt, rs } => {
                let sa = self.registers.read(rs) & 0x1F;
                self.registers.write(rd, self.registers.read(rt) >> sa);
            },
            MipsInstruction::Srav { rd, rt, rs } => {
                let sa = self.registers.read(rs) & 0x1F;
                self.registers.write(rd, ((self.registers.read(rt) as i32) >> sa) as u32);
            },

            // Mult/Div
            MipsInstruction::Mult { rs, rt } => {
                let res = (self.registers.read(rs) as i32 as i64) * (self.registers.read(rt) as i32 as i64);
                self.registers.lo = (res & 0xFFFFFFFF) as u32;
                self.registers.hi = ((res >> 32) & 0xFFFFFFFF) as u32;
            },
            MipsInstruction::Multu { rs, rt } => {
                let res = (self.registers.read(rs) as u64) * (self.registers.read(rt) as u64);
                self.registers.lo = (res & 0xFFFFFFFF) as u32;
                self.registers.hi = ((res >> 32) & 0xFFFFFFFF) as u32;
            },
            MipsInstruction::Div { rs, rt } => {
                let divisor = self.registers.read(rt) as i32;
                if divisor != 0 {
                    let dividend = self.registers.read(rs) as i32;
                    self.registers.lo = (dividend / divisor) as u32;
                    self.registers.hi = (dividend % divisor) as u32;
                }
            },
            MipsInstruction::Divu { rs, rt } => {
                let divisor = self.registers.read(rt);
                if divisor != 0 {
                    let dividend = self.registers.read(rs);
                    self.registers.lo = dividend / divisor;
                    self.registers.hi = dividend % divisor;
                }
            },
            MipsInstruction::Mfhi { rd } => self.registers.write(rd, self.registers.hi),
            MipsInstruction::Mflo { rd } => self.registers.write(rd, self.registers.lo),
            MipsInstruction::Mthi { rs } => self.registers.hi = self.registers.read(rs),
            MipsInstruction::Mtlo { rs } => self.registers.lo = self.registers.read(rs),

            // Immediate
            MipsInstruction::Addi { rt, rs, imm } => {
                let val = (self.registers.read(rs) as i32).wrapping_add(imm);
                self.registers.write(rt, val as u32);
            },
            MipsInstruction::Addiu { rt, rs, imm } => {
                let val = self.registers.read(rs).wrapping_add(imm as u32);
                self.registers.write(rt, val);
            },
            MipsInstruction::Andi { rt, rs, imm } => {
                let val = self.registers.read(rs) & (imm as u32);
                self.registers.write(rt, val);
            },
            MipsInstruction::Ori { rt, rs, imm } => {
                let val = self.registers.read(rs) | (imm as u32);
                self.registers.write(rt, val);
            },
            MipsInstruction::Xori { rt, rs, imm } => {
                let val = self.registers.read(rs) ^ (imm as u32);
                self.registers.write(rt, val);
            },
            MipsInstruction::Slti { rt, rs, imm } => {
                let val = if (self.registers.read(rs) as i32) < imm { 1 } else { 0 };
                self.registers.write(rt, val);
            },
            MipsInstruction::Sltiu { rt, rs, imm } => {
                let val = if self.registers.read(rs) < (imm as u32) { 1 } else { 0 };
                self.registers.write(rt, val);
            },
            MipsInstruction::Lui { rt, imm } => {
                let val = (imm as u32) << 16;
                self.registers.write(rt, val);
            },

            // Memory
            MipsInstruction::Lw { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.memory.read_word(addr)?;
                self.registers.write(rt, val);
            },
            MipsInstruction::Lb { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.memory.read_byte(addr)? as i8 as i32 as u32;
                self.registers.write(rt, val);
            },
            MipsInstruction::Lbu { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.memory.read_byte(addr)? as u32;
                self.registers.write(rt, val);
            },
            MipsInstruction::Lh { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.memory.read_half(addr)? as i16 as i32 as u32;
                self.registers.write(rt, val);
            },
            MipsInstruction::Lhu { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.memory.read_half(addr)? as u32;
                self.registers.write(rt, val);
            },
            MipsInstruction::Sw { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.registers.read(rt);
                self.memory.write_word(addr, val)?;
            },
            MipsInstruction::Sb { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = (self.registers.read(rt) & 0xFF) as u8;
                self.memory.write_byte(addr, val)?;
            },
            MipsInstruction::Sh { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = (self.registers.read(rt) & 0xFFFF) as u16;
                self.memory.write_half(addr, val)?;
            },

            // Branches
            MipsInstruction::Beq { rs, rt, label } => {
                if self.registers.read(rs) == self.registers.read(rt) {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Bne { rs, rt, label } => {
                if self.registers.read(rs) != self.registers.read(rt) {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Bltz { rs, label } => {
                if (self.registers.read(rs) as i32) < 0 {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Bgez { rs, label } => {
                if (self.registers.read(rs) as i32) >= 0 {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Blez { rs, label } => {
                if (self.registers.read(rs) as i32) <= 0 {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Bgtz { rs, label } => {
                if (self.registers.read(rs) as i32) > 0 {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },

            // J-Type
            MipsInstruction::J { label } => {
                next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
            },
            MipsInstruction::Jal { label } => {
                self.registers.write(31, (self.pc + 1) * 4);
                next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
            },
            MipsInstruction::Jr { rs } => {
                let target = self.registers.read(rs);
                if rs == 31 && target == 0 { // Simple heuristic for halt
                    self.is_halted = true;
                    self.output_buffer.push_str("\n[Program Halted]");
                } else {
                    next_pc = target / 4;
                }
            },
            MipsInstruction::Jalr { rd, rs } => {
                self.registers.write(rd, (self.pc + 1) * 4);
                next_pc = self.registers.read(rs) / 4;
            },

            // Special
            MipsInstruction::Syscall => {
                let v0 = self.registers.read(2);
                match v0 {
                    1 => {
                        let a0 = self.registers.read(4);
                        self.output_buffer.push_str(&format!("{}", a0 as i32));
                    },
                    10 => self.is_halted = true,
                    _ => self.output_buffer.push_str(&format!("\n[Syscall {} not implemented]", v0)),
                }
            },
            MipsInstruction::Break => {
                self.is_halted = true;
                self.output_buffer.push_str("\n[Break encountered]");
            },
            MipsInstruction::Noop => {},
        }

        self.pc = next_pc;
        Ok(true)
    }

    pub fn run_all(&mut self) -> Result<String, String> {
        let mut count = 0;
        while count < 10000 && !self.is_halted && self.pc < self.program.len() as u32 && self.step()? {
            count += 1;
        }
        
        let mut result = self.output_buffer.clone();
        if count >= 10000 {
            result.push_str("\n[Error: Timeout]");
        } else {
            result.push_str(&format!("\n[Completed in {} steps]", count));
        }
        Ok(result)
    }

    pub fn get_state(&self, message: String) -> SimulatorState {
        let current_line = self.instruction_to_line.get(self.pc as usize).cloned();
        
        SimulatorState {
            registers: self.registers.get_all(),
            hi: self.registers.hi,
            lo: self.registers.lo,
            pc: self.pc * 4,
            current_line,
            memory_sample: self.memory.get_sample(128),
            message,
        }
    }

    pub fn reset(&mut self) {
        self.registers.reset();
        self.memory.reset();
        self.pc = 0;
        self.is_halted = false;
        self.output_buffer.clear();
        self.instruction_to_line.clear();
    }
}
