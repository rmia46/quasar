#[cfg(test)]
mod tests {
    use crate::mips_engine::MipsEngine;

    fn run_test(code: &str) -> [u32; 32] {
        let mut engine = MipsEngine::new();
        engine.load_program(code).expect("Failed to load program");
        engine.run_all().expect("Failed to run program");
        engine.get_state("".to_string()).registers
    }

    #[test]
    fn test_arithmetic() {
        let code = "
            addi $t0, $zero, 10
            addi $t1, $zero, 20
            add  $t2, $t0, $t1
            sub  $t3, $t1, $t0
            addiu $t4, $zero, 0xFFFF
        ";
        let regs = run_test(code);
        assert_eq!(regs[8], 10);  // $t0
        assert_eq!(regs[9], 20);  // $t1
        assert_eq!(regs[10], 30); // $t2
        assert_eq!(regs[11], 10); // $t3
        assert_eq!(regs[12], 0xFFFF); // $t4
    }

    #[test]
    fn test_logic_and_shifts() {
        let code = "
            li $t0, 0xFF
            li $t1, 0x0F
            and $t2, $t0, $t1
            or  $t3, $t0, $t1
            sll $t4, $t1, 4
            srl $t5, $t4, 2
        ";
        let regs = run_test(code);
        assert_eq!(regs[10], 0x0F); // $t2
        assert_eq!(regs[11], 0xFF); // $t3
        assert_eq!(regs[12], 0xF0); // $t4
        assert_eq!(regs[13], 0x3C); // $t5
    }

    #[test]
    fn test_memory() {
        let code = "
            li $t0, 1234
            sw $t0, 0($zero)
            lw $t1, 0($zero)
            li $t2, 0xAB
            sb $t2, 10($zero)
            lbu $t3, 10($zero)
        ";
        let regs = run_test(code);
        assert_eq!(regs[8], 1234); // $t0
        assert_eq!(regs[9], 1234); // $t1
        assert_eq!(regs[11], 0xAB); // $t3
    }

    #[test]
    fn test_branches_and_loops() {
        let code = "
            li $t0, 0
            li $t1, 5
            loop:
                beq $t0, $t1, end
                addi $t0, $t0, 1
                j loop
            end:
                addi $s0, $zero, 100
        ";
        let regs = run_test(code);
        assert_eq!(regs[8], 5);   // $t0 should be 5
        assert_eq!(regs[16], 100); // $s0 should be reached
    }

    #[test]
    fn test_mult_div() {
        let code = "
            li $t0, 10
            li $t1, 3
            mult $t0, $t1
            mflo $s0
            div  $t0, $t1
            mflo $s1
            mfhi $s2
        ";
        let mut engine = MipsEngine::new();
        engine.load_program(code).unwrap();
        engine.run_all().unwrap();
        let state = engine.get_state("".into());
        assert_eq!(state.registers[16], 30); // $s0 = 10 * 3
        assert_eq!(state.registers[17], 3);  // $s1 = 10 / 3
        assert_eq!(state.registers[18], 1);  // $s2 = 10 % 3
    }

    #[test]
    fn test_jal_jr() {
        let code = "
            jal func
            li $s0, 1
            j exit
            
            func:
                li $s1, 2
                jr $ra
                
            exit:
                nop
        ";
        let regs = run_test(code);
        assert_eq!(regs[16], 1); // $s0
        assert_eq!(regs[17], 2); // $s1
    }

    #[test]
    fn test_data_and_la() {
        let code = "
            .data
            msg: .asciiz \"Hello\"
            
            .text
            main:
                la $a0, msg
                li $v0, 4
                syscall
        ";
        let mut engine = MipsEngine::new();
        engine.load_program(code).unwrap();
        engine.run_all().unwrap();
        let state = engine.get_state("".into());
        assert!(state.message.contains("Hello"));
    }

    #[test]
    fn test_pseudo_branches() {
        let code = "
            li $t0, 10
            li $t1, 5
            bge $t0, $t1, success
            li $s0, 0
            j end
            success:
                li $s0, 1
            end:
                nop
        ";
        let regs = run_test(code);
        assert_eq!(regs[16], 1); // $s0 should be 1
    }
}
