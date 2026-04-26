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
    Lw   { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Lb   { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Lbu  { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Lh   { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Lhu  { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Sw   { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Sb   { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Sh   { rt: usize, rs: Option<usize>, offset: i32, label: Option<String> },

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

    // Pseudo-instructions
    La   { rt: usize, label: String },
    Bge  { rs: usize, rt: usize, label: String },
    Ble  { rs: usize, rt: usize, label: String },
    Bgt  { rs: usize, rt: usize, label: String },
    Blt  { rs: usize, rt: usize, label: String },
    Beqz { rs: usize, label: String },
    Bnez { rs: usize, label: String },

    // Floating Point (Coprocessor 1)
    Mtc1  { rt: usize, fs: usize },
    Mfc1  { rt: usize, fs: usize },
    CvtSW { fd: usize, fs: usize },
    AddS  { fd: usize, fs: usize, ft: usize },
    AddD  { fd: usize, fs: usize, ft: usize },
    SubS  { fd: usize, fs: usize, ft: usize },
    SubD  { fd: usize, fs: usize, ft: usize },
    MulS  { fd: usize, fs: usize, ft: usize },
    MulD  { fd: usize, fs: usize, ft: usize },
    DivS  { fd: usize, fs: usize, ft: usize },
    DivD  { fd: usize, fs: usize, ft: usize },
    Swc1  { ft: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Lwc1  { ft: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Sdc1  { ft: usize, rs: Option<usize>, offset: i32, label: Option<String> },
    Ldc1  { ft: usize, rs: Option<usize>, offset: i32, label: Option<String> },

    // FP Pseudo-instructions
    LS    { ft: usize, label: String },
    SS    { ft: usize, label: String },
    LD    { ft: usize, label: String },
    SD    { ft: usize, label: String },
    MovS  { fd: usize, fs: usize },
    MovD  { fd: usize, fs: usize },

    // Special
    Syscall,
    Break,
    Noop,
}
