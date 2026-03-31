use super::instructions::MipsInstruction;

pub enum Directive {
    Data,
    Text,
    Asciiz(String),
}

pub enum ParseResult {
    Instruction(MipsInstruction),
    Directive(Directive),
}

pub struct Parser;

impl Parser {
    pub fn parse_line(line: &str) -> Result<Option<ParseResult>, String> {
        let line = line.trim();
        if line.is_empty() { return Ok(None); }

        if line.starts_with('.') {
            return Ok(Some(ParseResult::Directive(Self::parse_directive(line)?)));
        }

        let parts: Vec<&str> = line.split(|c: char| c == ',' || c.is_whitespace())
            .filter(|s| !s.is_empty())
            .collect();

        if parts.is_empty() { return Ok(None); }

        let op = parts[0].to_lowercase();
        match op.as_str() {
            // Arithmetic R-Type
            "add"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Add { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "addu" => Ok(Some(ParseResult::Instruction(MipsInstruction::Addu { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "sub"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Sub { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "subu" => Ok(Some(ParseResult::Instruction(MipsInstruction::Subu { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "and"  => Ok(Some(ParseResult::Instruction(MipsInstruction::And { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "or"   => Ok(Some(ParseResult::Instruction(MipsInstruction::Or  { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "xor"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Xor { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "nor"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Nor { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "slt"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Slt { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            "sltu" => Ok(Some(ParseResult::Instruction(MipsInstruction::Sltu { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? }))),
            
            // Shift
            "sll"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Sll { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, sa: Self::imm_u32(parts[3])? }))),
            "srl"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Srl { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, sa: Self::imm_u32(parts[3])? }))),
            "sra"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Sra { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, sa: Self::imm_u32(parts[3])? }))),
            "sllv" => Ok(Some(ParseResult::Instruction(MipsInstruction::Sllv { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, rs: Self::reg(parts[3])? }))),
            "srlv" => Ok(Some(ParseResult::Instruction(MipsInstruction::Srlv { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, rs: Self::reg(parts[3])? }))),
            "srav" => Ok(Some(ParseResult::Instruction(MipsInstruction::Srav { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, rs: Self::reg(parts[3])? }))),

            // Mult/Div
            "mult"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Mult { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? }))),
            "multu" => Ok(Some(ParseResult::Instruction(MipsInstruction::Multu { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? }))),
            "div"   => Ok(Some(ParseResult::Instruction(MipsInstruction::Div { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? }))),
            "divu"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Divu { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? }))),
            "mfhi"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Mfhi { rd: Self::reg(parts[1])? }))),
            "mflo"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Mflo { rd: Self::reg(parts[1])? }))),
            "mthi"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Mthi { rs: Self::reg(parts[1])? }))),
            "mtlo"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Mtlo { rs: Self::reg(parts[1])? }))),

            // Immediate
            "addi"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Addi { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? }))),
            "addiu" => Ok(Some(ParseResult::Instruction(MipsInstruction::Addiu { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? }))),
            "andi"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Andi { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? }))),
            "ori"   => Ok(Some(ParseResult::Instruction(MipsInstruction::Ori  { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? }))),
            "xori"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Xori { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? }))),
            "slti"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Slti { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? }))),
            "sltiu" => Ok(Some(ParseResult::Instruction(MipsInstruction::Sltiu { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? }))),
            "lui"   => Ok(Some(ParseResult::Instruction(MipsInstruction::Lui  { rt: Self::reg(parts[1])?, imm: Self::imm_u16(parts[2])? }))),
            
            // Memory
            "lw"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Lw { rt: Self::reg(parts[1])?, rs, offset })))
            },
            "lb"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Lb { rt: Self::reg(parts[1])?, rs, offset })))
            },
            "lbu"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Lbu { rt: Self::reg(parts[1])?, rs, offset })))
            },
            "lh"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Lh { rt: Self::reg(parts[1])?, rs, offset })))
            },
            "lhu"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Lhu { rt: Self::reg(parts[1])?, rs, offset })))
            },
            "sw"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Sw { rt: Self::reg(parts[1])?, rs, offset })))
            },
            "sb"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Sb { rt: Self::reg(parts[1])?, rs, offset })))
            },
            "sh"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(ParseResult::Instruction(MipsInstruction::Sh { rt: Self::reg(parts[1])?, rs, offset })))
            },

            // Branches
            "beq"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Beq { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() }))),
            "bne"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Bne { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() }))),
            "bltz" => Ok(Some(ParseResult::Instruction(MipsInstruction::Bltz { rs: Self::reg(parts[1])?, label: parts[2].to_string() }))),
            "bgez" => Ok(Some(ParseResult::Instruction(MipsInstruction::Bgez { rs: Self::reg(parts[1])?, label: parts[2].to_string() }))),
            "blez" => Ok(Some(ParseResult::Instruction(MipsInstruction::Blez { rs: Self::reg(parts[1])?, label: parts[2].to_string() }))),
            "bgtz" => Ok(Some(ParseResult::Instruction(MipsInstruction::Bgtz { rs: Self::reg(parts[1])?, label: parts[2].to_string() }))),
            "bge"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Bge { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() }))),
            "ble"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Ble { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() }))),
            "bgt"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Bgt { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() }))),
            "blt"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Blt { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() }))),
            "beqz" => Ok(Some(ParseResult::Instruction(MipsInstruction::Beqz { rs: Self::reg(parts[1])?, label: parts[2].to_string() }))),
            "bnez" => Ok(Some(ParseResult::Instruction(MipsInstruction::Bnez { rs: Self::reg(parts[1])?, label: parts[2].to_string() }))),
            
            // J-Type
            "j"    => Ok(Some(ParseResult::Instruction(MipsInstruction::J    { label: parts[1].to_string() }))),
            "jal"  => Ok(Some(ParseResult::Instruction(MipsInstruction::Jal  { label: parts[1].to_string() }))),
            "jr"   => Ok(Some(ParseResult::Instruction(MipsInstruction::Jr   { rs: Self::reg(parts[1])? }))),
            "jalr" => Ok(Some(ParseResult::Instruction(MipsInstruction::Jalr { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])? }))),

            // Pseudo-instructions
            "li"   => Ok(Some(ParseResult::Instruction(MipsInstruction::Addiu { rt: Self::reg(parts[1])?, rs: 0, imm: Self::imm_i32(parts[2])? }))),
            "la"   => Ok(Some(ParseResult::Instruction(MipsInstruction::La { rt: Self::reg(parts[1])?, label: parts[2].to_string() }))),
            "move" => Ok(Some(ParseResult::Instruction(MipsInstruction::Addu  { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: 0 }))),

            "syscall" => Ok(Some(ParseResult::Instruction(MipsInstruction::Syscall))),
            "break"   => Ok(Some(ParseResult::Instruction(MipsInstruction::Break))),
            "nop" => Ok(Some(ParseResult::Instruction(MipsInstruction::Noop))),
            _ => Err(format!("Unknown instruction: {}", op)),
        }
    }

    fn parse_directive(line: &str) -> Result<Directive, String> {
        let parts: Vec<&str> = line.split_whitespace().collect();
        let name = parts[0].to_lowercase();
        match name.as_str() {
            ".data" => Ok(Directive::Data),
            ".text" => Ok(Directive::Text),
            ".asciiz" => {
                let content = Self::parse_asciiz(line)?;
                Ok(Directive::Asciiz(content))
            },
            _ => Err(format!("Unknown directive: {}", name)),
        }
    }

    fn parse_asciiz(line: &str) -> Result<String, String> {
        let first_quote = line.find('"').ok_or("Missing opening quote in .asciiz")?;
        let last_quote = line.rfind('"').ok_or("Missing closing quote in .asciiz")?;
        if first_quote == last_quote { return Err("Missing closing quote in .asciiz".to_string()); }
        let mut s = line[first_quote + 1..last_quote].to_string();
        // Handle basic escapes
        s = s.replace("\\n", "\n").replace("\\t", "\t").replace("\\\"", "\"");
        Ok(s)
    }

    fn reg(s: &str) -> Result<usize, String> {
        let s = s.trim_start_matches('$');
        match s {
            "zero" | "0" => Ok(0), "at" | "1" => Ok(1),
            "v0" | "2" => Ok(2), "v1" | "3" => Ok(3),
            "a0" | "4" => Ok(4), "a1" | "5" => Ok(5), "a2" | "6" => Ok(6), "a3" | "7" => Ok(7),
            "t0" | "8" => Ok(8), "t1" | "9" => Ok(9), "t2" | "10" => Ok(10), "t3" | "11" => Ok(11),
            "t4" | "12" => Ok(12), "t5" | "13" => Ok(13), "t6" | "14" => Ok(14), "t7" | "15" => Ok(15),
            "s0" | "16" => Ok(16), "s1" | "17" => Ok(17), "s2" | "18" => Ok(18), "s3" | "19" => Ok(19),
            "s4" | "20" => Ok(20), "s5" | "21" => Ok(21), "s6" | "22" => Ok(22), "s7" | "23" => Ok(23),
            "t8" | "24" => Ok(24), "t9" | "25" => Ok(25),
            "ra" | "31" => Ok(31),
            "sp" | "29" => Ok(29), "fp" | "30" => Ok(30), "gp" | "28" => Ok(28),
            _ => s.parse::<usize>().map_err(|_| format!("Invalid register: ${}", s)),
        }
    }

    fn imm_i32(s: &str) -> Result<i32, String> {
        if s.starts_with("0x") {
            i32::from_str_radix(&s[2..], 16).map_err(|_| format!("Invalid hex: {}", s))
        } else {
            s.parse::<i32>().map_err(|_| format!("Invalid decimal: {}", s))
        }
    }

    fn imm_u16(s: &str) -> Result<u16, String> {
        if s.starts_with("0x") {
            u16::from_str_radix(&s[2..], 16).map_err(|_| format!("Invalid hex: {}", s))
        } else {
            s.parse::<u16>().map_err(|_| format!("Invalid decimal: {}", s))
        }
    }

    fn imm_u32(s: &str) -> Result<u32, String> {
        if s.starts_with("0x") {
            u32::from_str_radix(&s[2..], 16).map_err(|_| format!("Invalid hex: {}", s))
        } else {
            s.parse::<u32>().map_err(|_| format!("Invalid decimal: {}", s))
        }
    }

    fn parse_mem(s: &str) -> Result<(i32, usize), String> {
        let parts: Vec<&str> = s.split(|c| c == '(' || c == ')').filter(|p| !p.is_empty()).collect();
        if parts.len() != 2 { return Err(format!("Invalid memory syntax: {}", s)); }
        let offset = Self::imm_i32(parts[0])?;
        let rs = Self::reg(parts[1])?;
        Ok((offset, rs))
    }
}
