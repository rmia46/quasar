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
            // R-Type
            "add" => Ok(Some(MipsInstruction::Add { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "sub" => Ok(Some(MipsInstruction::Sub { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "and" => Ok(Some(MipsInstruction::And { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "or"  => Ok(Some(MipsInstruction::Or  { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "xor" => Ok(Some(MipsInstruction::Xor { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "nor" => Ok(Some(MipsInstruction::Nor { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            "slt" => Ok(Some(MipsInstruction::Slt { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: Self::reg(parts[3])? })),
            
            // I-Type
            "addi" => Ok(Some(MipsInstruction::Addi { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_i32(parts[3])? })),
            "andi" => Ok(Some(MipsInstruction::Andi { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? })),
            "ori"  => Ok(Some(MipsInstruction::Ori  { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? })),
            "xori" => Ok(Some(MipsInstruction::Xori { rt: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, imm: Self::imm_u16(parts[3])? })),
            "lui"  => Ok(Some(MipsInstruction::Lui  { rt: Self::reg(parts[1])?, imm: Self::imm_u16(parts[2])? })),
            "lw"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Lw { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "sw"   => {
                let (offset, rs) = Self::parse_mem(parts[2])?;
                Ok(Some(MipsInstruction::Sw { rt: Self::reg(parts[1])?, rs, offset }))
            },
            "beq"  => Ok(Some(MipsInstruction::Beq { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() })),
            "bne"  => Ok(Some(MipsInstruction::Bne { rs: Self::reg(parts[1])?, rt: Self::reg(parts[2])?, label: parts[3].to_string() })),
            
            // J-Type
            "j"    => Ok(Some(MipsInstruction::J    { label: parts[1].to_string() })),
            "jal"  => Ok(Some(MipsInstruction::Jal  { label: parts[1].to_string() })),
            "jr"   => Ok(Some(MipsInstruction::Jr   { rs: Self::reg(parts[1])? })),

            // Pseudo-instructions
            "li"   => Ok(Some(MipsInstruction::Addi { rt: Self::reg(parts[1])?, rs: 0, imm: Self::imm_i32(parts[2])? })),
            "move" => Ok(Some(MipsInstruction::Add  { rd: Self::reg(parts[1])?, rs: Self::reg(parts[2])?, rt: 0 })),

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

    fn parse_mem(s: &str) -> Result<(i32, usize), String> {
        let parts: Vec<&str> = s.split(|c| c == '(' || c == ')').filter(|p| !p.is_empty()).collect();
        if parts.len() != 2 { return Err(format!("Invalid memory syntax: {}", s)); }
        let offset = Self::imm_i32(parts[0])?;
        let rs = Self::reg(parts[1])?;
        Ok((offset, rs))
    }
}
