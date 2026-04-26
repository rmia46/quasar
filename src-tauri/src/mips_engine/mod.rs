pub mod registers;
pub mod memory;
pub mod instructions;
pub mod parser;
#[cfg(test)]
mod tests;

pub use registers::RegisterFile;
pub use memory::Memory;
pub use instructions::MipsInstruction;
pub use parser::{Parser, ParseResult, Directive};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

const DATA_SEGMENT_START: u32 = 0x2000;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SimulatorState {
    pub registers: [u32; 32],
    pub fp_registers: [u32; 32],
    pub hi: u32,
    pub lo: u32,
    pub pc: u32,
    pub current_line: Option<u32>,
    pub memory_sample: Vec<u8>,
    pub message: String,
}

pub struct MipsEngine {
    registers: RegisterFile,
    memory: Memory,
    pc: u32,
    program: Vec<MipsInstruction>,
    labels: HashMap<String, u32>,
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
        let mut data_ptr = DATA_SEGMENT_START;
        let mut current_section = "text";

        for (zero_based_line, raw_line) in assembly.lines().enumerate() {
            let line_num = (zero_based_line + 1) as u32;
            let line = raw_line.split('#').next().unwrap_or("").trim();
            if line.is_empty() { continue; }

            let mut processing_line = line;
            if let Some(colon_idx) = processing_line.find(':') {
                let label = processing_line[..colon_idx].trim().to_string();
                if !label.is_empty() {
                    if current_section == "text" {
                        temp_labels.insert(label, instruction_index);
                    } else {
                        temp_labels.insert(label, data_ptr);
                    }
                }
                processing_line = processing_line[colon_idx + 1..].trim();
            }
            if processing_line.is_empty() { continue; }

            match Parser::parse_line(processing_line) {
                Ok(Some(ParseResult::Directive(d))) => {
                    match d {
                        Directive::Data => current_section = "data",
                        Directive::Text => current_section = "text",
                        Directive::Asciiz(s) => {
                            if current_section != "data" { return Err(format!("Line {}: .asciiz must be in .data section", line_num)); }
                            for b in s.as_bytes() {
                                self.memory.write_byte(data_ptr, *b)?;
                                data_ptr += 1;
                            }
                            self.memory.write_byte(data_ptr, 0)?;
                            data_ptr += 1;
                        },
                        Directive::Float(floats) => {
                            if current_section != "data" { return Err(format!("Line {}: .float must be in .data section", line_num)); }
                            while data_ptr % 4 != 0 { data_ptr += 1; }
                            for f in floats {
                                self.memory.write_word(data_ptr, f.to_bits())?;
                                data_ptr += 4;
                            }
                        },
                        Directive::Double(doubles) => {
                            if current_section != "data" { return Err(format!("Line {}: .double must be in .data section", line_num)); }
                            while data_ptr % 8 != 0 { data_ptr += 1; }
                            for d in doubles {
                                let bits = d.to_bits();
                                self.memory.write_word(data_ptr, (bits & 0xFFFFFFFF) as u32)?;
                                self.memory.write_word(data_ptr + 4, (bits >> 32) as u32)?;
                                data_ptr += 8;
                            }
                        },
                        Directive::Word(words) => {
                            if current_section != "data" { return Err(format!("Line {}: .word must be in .data section", line_num)); }
                            while data_ptr % 4 != 0 { data_ptr += 1; }
                            for w in words {
                                self.memory.write_word(data_ptr, w as u32)?;
                                data_ptr += 4;
                            }
                        }
                    }
                },
                Ok(Some(ParseResult::Instruction(inst))) => {
                    if current_section != "text" { 
                        return Err(format!("Line {}: Instruction '{}' found in the {} section. Did you forget to add a '.text' directive?", line_num, processing_line, current_section)); 
                    }
                    instructions.push(inst);
                    line_mappings.push(line_num);
                    instruction_index += 1;
                },
                Ok(None) => {},
                Err(e) => return Err(format!("Line {}: {}", line_num, e)),
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
            MipsInstruction::Lw { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.registers.write(rt, self.memory.read_word(addr)?);
            },
            MipsInstruction::Lb { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.registers.write(rt, self.memory.read_byte(addr)? as i8 as i32 as u32);
            },
            MipsInstruction::Lbu { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.registers.write(rt, self.memory.read_byte(addr)? as u32);
            },
            MipsInstruction::Lh { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.registers.write(rt, self.memory.read_half(addr)? as i16 as i32 as u32);
            },
            MipsInstruction::Lhu { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.registers.write(rt, self.memory.read_half(addr)? as u32);
            },
            MipsInstruction::Sw { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.memory.write_word(addr, self.registers.read(rt))?;
            },
            MipsInstruction::Sb { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.memory.write_byte(addr, (self.registers.read(rt) & 0xFF) as u8)?;
            },
            MipsInstruction::Sh { rt, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.memory.write_half(addr, (self.registers.read(rt) & 0xFFFF) as u16)?;
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
            MipsInstruction::J { label } => {
                next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
            },
            MipsInstruction::Jal { label } => {
                self.registers.write(31, (self.pc + 1) * 4);
                next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
            },
            MipsInstruction::Jr { rs } => {
                let target = self.registers.read(rs);
                if rs == 31 && target == 0 {
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
            MipsInstruction::La { rt, label } => {
                let addr = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                self.registers.write(rt, addr);
            },
            MipsInstruction::Bge { rs, rt, label } => {
                if (self.registers.read(rs) as i32) >= (self.registers.read(rt) as i32) {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Ble { rs, rt, label } => {
                if (self.registers.read(rs) as i32) <= (self.registers.read(rt) as i32) {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Bgt { rs, rt, label } => {
                if (self.registers.read(rs) as i32) > (self.registers.read(rt) as i32) {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Blt { rs, rt, label } => {
                if (self.registers.read(rs) as i32) < (self.registers.read(rt) as i32) {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Beqz { rs, label } => {
                if self.registers.read(rs) == 0 {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Bnez { rs, label } => {
                if self.registers.read(rs) != 0 {
                    next_pc = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                }
            },
            MipsInstruction::Mtc1 { rt, fs } => {
                self.registers.write_fp(fs, f32::from_bits(self.registers.read(rt)));
            },
            MipsInstruction::Mfc1 { rt, fs } => {
                self.registers.write(rt, self.registers.read_fp(fs).to_bits());
            },
            MipsInstruction::CvtSW { fd, fs } => {
                let int_val = self.registers.read_fp(fs).to_bits() as i32;
                self.registers.write_fp(fd, int_val as f32);
            },
            MipsInstruction::AddS { fd, fs, ft } => {
                self.registers.write_fp(fd, self.registers.read_fp(fs) + self.registers.read_fp(ft));
            },
            MipsInstruction::AddD { fd, fs, ft } => {
                self.registers.write_fp(fd, (self.registers.read_fp(fs) as f64 + self.registers.read_fp(ft) as f64) as f32);
            },
            MipsInstruction::SubS { fd, fs, ft } => {
                self.registers.write_fp(fd, self.registers.read_fp(fs) - self.registers.read_fp(ft));
            },
            MipsInstruction::SubD { fd, fs, ft } => {
                self.registers.write_fp(fd, (self.registers.read_fp(fs) as f64 - self.registers.read_fp(ft) as f64) as f32);
            },
            MipsInstruction::MulS { fd, fs, ft } => {
                self.registers.write_fp(fd, self.registers.read_fp(fs) * self.registers.read_fp(ft));
            },
            MipsInstruction::MulD { fd, fs, ft } => {
                self.registers.write_fp(fd, (self.registers.read_fp(fs) as f64 * self.registers.read_fp(ft) as f64) as f32);
            },
            MipsInstruction::DivS { fd, fs, ft } => {
                let t = self.registers.read_fp(ft);
                if t != 0.0 { self.registers.write_fp(fd, self.registers.read_fp(fs) / t); }
            },
            MipsInstruction::DivD { fd, fs, ft } => {
                let t = self.registers.read_fp(ft) as f64;
                if t != 0.0 { self.registers.write_fp(fd, (self.registers.read_fp(fs) as f64 / t) as f32); }
            },
            MipsInstruction::Swc1 { ft, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.memory.write_word(addr, self.registers.read_fp(ft).to_bits())?;
            },
            MipsInstruction::Lwc1 { ft, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.registers.write_fp(ft, f32::from_bits(self.memory.read_word(addr)?));
            },
            MipsInstruction::Sdc1 { ft, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.memory.write_word(addr, self.registers.read_fp(ft).to_bits())?;
            },
            MipsInstruction::Ldc1 { ft, rs, offset, label } => {
                let addr = self.resolve_address(rs, offset, label)?;
                self.registers.write_fp(ft, f32::from_bits(self.memory.read_word(addr)?));
            },
            MipsInstruction::LS { ft, label } => {
                let addr = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                self.registers.write_fp(ft, f32::from_bits(self.memory.read_word(addr)?));
            },
            MipsInstruction::SS { ft, label } => {
                let addr = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                self.memory.write_word(addr, self.registers.read_fp(ft).to_bits())?;
            },
            MipsInstruction::LD { ft, label } => {
                let addr = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                self.registers.write_fp(ft, f32::from_bits(self.memory.read_word(addr)?));
            },
            MipsInstruction::SD { ft, label } => {
                let addr = *self.labels.get(&label).ok_or(format!("Undefined label: {}", label))?;
                self.memory.write_word(addr, self.registers.read_fp(ft).to_bits())?;
            },
            MipsInstruction::MovS { fd, fs } => self.registers.write_fp(fd, self.registers.read_fp(fs)),
            MipsInstruction::MovD { fd, fs } => self.registers.write_fp(fd, self.registers.read_fp(fs)),
            MipsInstruction::Syscall => {
                let v0 = self.registers.read(2);
                match v0 {
                    1 => self.output_buffer.push_str(&format!("{}", self.registers.read(4) as i32)),
                    2 => self.output_buffer.push_str(&format!("{}", self.registers.read_fp(12))),
                    4 => {
                        let mut addr = self.registers.read(4);
                        loop {
                            let b = self.memory.read_byte(addr)?;
                            if b == 0 { break; }
                            self.output_buffer.push(b as char);
                            addr += 1;
                        }
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

    pub fn get_state(&mut self, message: String) -> SimulatorState {
        let current_line = self.instruction_to_line.get(self.pc as usize).cloned();
        let combined_message = if self.output_buffer.is_empty() { message } else {
            let pending = self.output_buffer.clone();
            self.output_buffer.clear();
            if message.is_empty() { pending } else { format!("{}\n{}", pending, message) }
        };
        SimulatorState {
            registers: self.registers.get_all(),
            fp_registers: self.registers.fpr.map(|f| f.to_bits()),
            hi: self.registers.hi,
            lo: self.registers.lo,
            pc: self.pc * 4,
            current_line,
            memory_sample: self.memory.get_sample_at(DATA_SEGMENT_START, 128),
            message: combined_message,
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

    pub fn get_pc(&self) -> u32 { self.pc }

    fn resolve_address(&self, rs: Option<usize>, offset: i32, label: Option<String>) -> Result<u32, String> {
        if let Some(l) = label {
            self.labels.get(&l).cloned().ok_or(format!("Undefined label: {}", l))
        } else if let Some(r) = rs {
            Ok((self.registers.read(r) as i32 + offset) as u32)
        } else {
            Err("Invalid address format".to_string())
        }
    }
}
