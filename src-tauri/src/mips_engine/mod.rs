pub mod registers;
pub mod memory;
pub mod instructions;
pub mod parser;

pub use registers::RegisterFile;
pub use memory::Memory;
pub use instructions::MipsInstruction;
pub use parser::Parser;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SimulatorState {
    pub registers: [u32; 32],
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
            MipsInstruction::Add { rd, rs, rt } => {
                let val = self.registers.read(rs).wrapping_add(self.registers.read(rt));
                self.registers.write(rd, val);
            },
            MipsInstruction::Sub { rd, rs, rt } => {
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
            MipsInstruction::Addi { rt, rs, imm } => {
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
            MipsInstruction::Lui { rt, imm } => {
                let val = (imm as u32) << 16;
                self.registers.write(rt, val);
            },
            MipsInstruction::Lw { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.memory.read_word(addr)?;
                self.registers.write(rt, val);
            },
            MipsInstruction::Sw { rt, rs, offset } => {
                let addr = (self.registers.read(rs) as i32).wrapping_add(offset) as u32;
                let val = self.registers.read(rt);
                self.memory.write_word(addr, val)?;
            },
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
            MipsInstruction::J { label } => {
                next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
            },
            MipsInstruction::Jal { label } => {
                self.registers.write(31, (self.pc + 1) * 4);
                next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
            },
            MipsInstruction::Jr { rs } => {
                if rs == 31 {
                    self.is_halted = true;
                    self.output_buffer.push_str("\n[Program Halted via JR $ra]");
                } else {
                    return Err("Complex JR not supported".to_string());
                }
            },
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
        while count < 5000 && !self.is_halted && self.step()? {
            count += 1;
        }
        
        let mut result = self.output_buffer.clone();
        if count >= 5000 {
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
            pc: self.pc * 4,
            current_line,
            memory_sample: self.memory.get_sample(256),
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
