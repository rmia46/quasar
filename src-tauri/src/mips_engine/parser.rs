use super::instructions::MipsInstruction;

pub struct Parser;

impl Parser {
    pub fn parse_line(line: &str) -> Result<Option<MipsInstruction>, String> {
        let parts: Vec<&str> = line.split(|c: char| c == ',' || c.is_whitespace())
            .filter(|s| !s.is_empty())
            .collect();

        if parts.is_empty() { return Ok(None); }

        let op = parts[0].to_lowercase();
        match op.as_str() {
            // Arithmetic R-Type
            "add"  => Ok(Some(MipsInstruction::Add { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "addu" => Ok(Some(MipsInstruction::Addu { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "sub"  => Ok(Some(MipsInstruction::Sub { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "subu" => Ok(Some(MipsInstruction::Subu { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "and"  => Ok(Some(MipsInstruction::And { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "or"   => Ok(Some(MipsInstruction::Or  { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "xor"  => Ok(Some(MipsInstruction::Xor { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "nor"  => Ok(Some(MipsInstruction::Nor { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "slt"  => Ok(Some(MipsInstruction::Slt { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "sltu" => Ok(Some(MipsInstruction::Sltu { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            
            // Shift
            "sll"  => Ok(Some(MipsInstruction::Sll { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, sa: Self::imm_u32(parts[3])? })),
            "srl"  => Ok(Some(MipsInstruction::Srl { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, sa: Self::imm_u32(parts[3])? })),
            "sra"  => Ok(Some(MipsInstruction::Sra { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, sa: Self::imm_u32(parts[3])? })),
            "sllv" => Ok(Some(MipsInstruction::Sllv { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, rs: Self::reg(parts[3])? })),
            "srlv" => Ok(Some(MipsInstruction::Srlv { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, rs: Self::reg(parts[3])? })),
            "srav" => Ok(Some(MipsInstruction::Srav { rd: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, rs: Self::reg(parts[3])? })),

            // Mult/Div
            "mult"  => Ok(Some(MipsInstruction::Mult { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? })),
            "multu" => Ok(Some(MipsInstruction::Multu { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? })),
            "div"   => Ok(Some(MipsInstruction::Div { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? })),
            "divu"  => Ok(Some(MipsInstruction::Divu { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])? })),
            "mfhi"  => Ok(Some(MipsInstruction::Mfhi { rd: Self::reg(parts[1])? })),
            "mflo"  => Ok(Some(MipsInstruction::Mflo { rd: Self::reg(parts[1])? })),
            "mthi"  => Ok(Some(MipsInstruction::Mthi { rs: Self::reg(parts[1])? })),
            "mtlo"  => Ok(Some(MipsInstruction::Mtlo { rs: Self::reg(parts[1])? })),

            // Immediate
            "addi"  => Ok(Some(MipsInstruction::Addi { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? })),
            "addiu" => Ok(Some(MipsInstruction::Addiu { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? })),
            "andi"  => Ok(Some(MipsInstruction::Andi { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? })),
            "ori"   => Ok(Some(MipsInstruction::Ori  { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? })),
            "xori"  => Ok(Some(MipsInstruction::Xori { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? })),
            "slti"  => Ok(Some(MipsInstruction::Slti { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? })),
            "sltiu" => Ok(Some(MipsInstruction::Sltiu { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? })),
            "lui"   => Ok(Some(MipsInstruction::Lui  { rt: Self::reg(parts[1])?, imm: Self::imm_u16(parts[2])? })),
            
            // Memory
            "lw"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Lw { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "lb"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Lb { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "lbu"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Lbu { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "lh"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Lh { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "lhu"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Lhu { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "sw"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Sw { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "sb"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Sb { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "sh"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Sh { rt: Self::reg(parts[1])?, rs, offset }))
            },

            // Branches
            "beq"  => Ok(Some(MipsInstruction::Beq { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() })),
            "bne"  => Ok(Some(MipsInstruction::Bne { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() })),
            "bltz" => Ok(Some(MipsInstruction::Bltz { rs: Self::reg(parts[1])?, label: parts[2].to_string() })),
            "bgez" => Ok(Some(MipsInstruction::Bgez { rs: Self::reg(parts[1])?, label: parts[2].to_string() })),
            "blez" => Ok(Some(MipsInstruction::Blez { rs: Self::reg(parts[1])?, label: parts[2].to_string() })),
            "bgtz" => Ok(Some(MipsInstruction::Bgtz { rs: Self::reg(parts[1])?, label: parts[2].to_string() })),
            
            // J-Type
            "j"    => Ok(Some(MipsInstruction::J    { label: parts[1].to_string() })),
            "jal"  => Ok(Some(MipsInstruction::Jal  { label: parts[1].to_string() })),
            "jr"   => Ok(Some(MipsInstruction::Jr   { rs: Self::reg(parts[1])? })),
            "jalr" => Ok(Some(MipsInstruction::Jalr { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])? })),

            // Pseudo-instructions
            "li"   => Ok(Some(MipsInstruction::Addiu { rt: Self::reg(parts[1])?, rs: 0, imm: Self::imm_i32(parts[2])? })),
            "move" => Ok(Some(MipsInstruction::Addu  { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: 0 })),

            "syscall" => Ok(Some(MipsInstruction::Syscall)),
            "break"   => Ok(Some(MipsInstruction::Break)),
            "nop" => Ok(Some(MipsInstruction::Noop)),
            _ => Err(format!("Unknown instruction: {}", op)),
        }
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
