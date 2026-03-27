#[derive(Debug, Clone)]
pub enum MipsInstruction {
    // R-Type: op rd, rs, rt
    Add { rd: usize, rs: usize, rt: usize },
    Sub { rd: usize, rs: usize, rt: usize },
    And { rd: usize, rs: usize, rt: usize },
    Or  { rd: usize, rs: usize, rt: usize },
    Xor { rd: usize, rs: usize, rt: usize },
    Nor { rd: usize, rs: usize, rt: usize },
    Slt { rd: usize, rs: usize, rt: usize },

    // I-Type: op rt, rs, imm
    Addi { rt: usize, rs: usize, imm: i32 },
    Andi { rt: usize, rs: usize, imm: u16 },
    Ori  { rt: usize, rs: usize, imm: u16 },
    Xori { rt: usize, rs: usize, imm: u16 },
    Lui  { rt: usize, imm: u16 },
    Lw   { rt: usize, rs: usize, offset: i32 },
    Sw   { rt: usize, rs: usize, offset: i32 },
    Beq  { rs: usize, rt: usize, label: String },
    Bne  { rs: usize, rt: usize, label: String },

    // J-Type: op label
    J    { label: String },
    Jal  { label: String },
    Jr   { rs: usize },

    // Special
    Syscall,
    Break,
    Noop,
}
