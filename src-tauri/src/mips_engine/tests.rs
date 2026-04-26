#[cfg(test)]
mod tests {
    use super::super::MipsEngine;

    #[test]
    fn test_full_pipeline() {
        let mut engine = MipsEngine::new();
        let code = r#"
            .data
                val_f:  .float 1.5, 2.5
                val_w:  .word 10, 20
                msg:    .asciiz "Test"
            .text
            main:
                # Test Integer
                lw $t0, val_w       # $t0 = 10
                addi $t1, $t0, 5    # $t1 = 15
                
                # Test Float
                l.s $f0, val_f      # $f0 = 1.5
                li $t2, 2
                mtc1 $t2, $f1
                cvt.s.w $f1, $f1    # $f1 = 2.0
                add.s $f2, $f0, $f1 # $f2 = 3.5
                
                # Test Jump
                j end
                addi $t1, $t1, 100  # Should be skipped
            end:
                nop
        "#;

        engine.load_program(code).expect("Failed to load");
        
        // Run until completion or timeout
        let _ = engine.run_all().expect("Execution failed");
        let state = engine.get_state("".to_string());

        assert_eq!(state.registers[9], 15); // $t1
        
        // Check float result (3.5)
        let f2_bits = state.fp_registers[2];
        let f2 = f32::from_bits(f2_bits);
        assert!((f2 - 3.5).abs() < 0.001);
    }

    #[test]
    fn test_pseudo_instructions() {
        let mut engine = MipsEngine::new();
        let code = r#"
            .text
            li $t0, 100
            li $t1, 200
            move $t2, $t0
            bge $t1, $t0, target
            li $t2, 0       # Skip
            target:
                addi $t2, $t2, 1
        "#;
        engine.load_program(code).unwrap();
        engine.run_all().unwrap();
        let state = engine.get_state("".to_string());
        assert_eq!(state.registers[10], 101); // $t2 should be 100 + 1
    }

    #[test]
    fn test_memory_alignment() {
        let mut engine = MipsEngine::new();
        let code = r#"
            .data
            .byte 1
            .word 0xABCDEFFF  # Should trigger alignment to 4
            .text
            li $s0, 0x2000
            lw $t0, 4($s0)    # Should read the word at 0x2004
        "#;
        // Currently .byte isn't in parser, let's test existing alignment for .float
        let code = r#"
            .data
            .asciiz "A"       # 2 bytes including null
            .float 1.0        # Should align to 0x2004
            .text
            li $s0, 0x2000
            lw $t1, 4($s0)    # Read float bits as word
        "#;
        engine.load_program(code).unwrap();
        engine.run_all().unwrap();
        let state = engine.get_state("".to_string());
        assert_eq!(state.registers[9], (1.0f32).to_bits());
    }
}
