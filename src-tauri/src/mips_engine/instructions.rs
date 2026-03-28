#[derive(Debug, Clone)]
pub enum MipsInstruction {
    // R-Type: op rd, rs, rt
    Add { rd: usize, rs: usize, rt: usize },
    Addu { rd: usize, rs: usize, rt: usize },
    Sub { rd: usize, rs: usize, rt: usize },
    Subu { rd: usize, rs: usize, rt: usize },
    And { rd: usize, rs: usize, rt: usize },
    Or  { rd: usize, rs: usize, rt: usize },
    Xor { rd: usize, rs: usize, rt: usize },
    Nor { rd: usize, rs: usize, rt: usize },
    Slt { rd: usize, rs: usize, rt: usize },
    Sltu { rd: usize, rs: usize, rt: usize },

    // Shift: op rd, rt, sa
    Sll { rd: usize, rt: usize, sa: u32 },
    Srl { rd: usize, rt: usize, sa: u32 },
    Sra { rd: usize, rt: usize, sa: u32 },
    Sllv { rd: usize, rt: usize, rs: usize },
    Srlv { rd: usize, rt: usize, rs: usize },
    Srav { rd: usize, rt: usize, rs: usize },

    // Mult/Div
    Mult { rs: usize, rt: usize },
    Multu { rs: usize, rt: usize },
    Div { rs: usize, rt: usize },
    Divu { rs: usize, rt: usize },
    Mfhi { rd: usize },
    Mflo { rd: usize },
    Mthi { rs: usize },
    Mtlo { rs: usize },

    // I-Type: op rt, rs, imm
    Addi { rt: usize, rs: usize, imm: i32 },
    Addiu { rt: usize, rs: usize, imm: i32 },
    Andi { rt: usize, rs: usize, imm: u16 },
    Ori  { rt: usize, rs: usize, imm: u16 },
    Xori { rt: usize, rs: usize, imm: u16 },
    Slti { rt: usize, rs: usize, imm: i32 },
    Sltiu { rt: usize, rs: usize, imm: i32 },
    Lui  { rt: usize, imm: u16 },

    // Memory
    Lw   { rt: usize, rs: usize, offset: i32 },
    Lb   { rt: usize, rs: usize, offset: i32 },
    Lbu  { rt: usize, rs: usize, offset: i32 },
    Lh   { rt: usize, rs: usize, offset: i32 },
    Lhu  { rt: usize, rs: usize, offset: i32 },
    Sw   { rt: usize, rs: usize, offset: i32 },
    Sb   { rt: usize, rs: usize, offset: i32 },
    Sh   { rt: usize, rs: usize, offset: i32 },

    // Branches
    Beq  { rs: usize, rt: usize, label: String },
    Bne  { rs: usize, rt: usize, label: String },
    Bltz { rs: usize, label: String },
    Bgez { rs: usize, label: String },
    Blez { rs: usize, label: String },
    Bgtz { rs: usize, label: String },

    // J-Type: op label
    J    { label: String },
    Jal  { label: String },
    Jr   { rs: usize },
    Jalr { rd: usize, rs: usize },

    // Special
    Syscall,
    Break,
    Noop,
}
