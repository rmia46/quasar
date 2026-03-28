# <img src="public/quasar-logo.svg" width="40" height="40" align="center" /> Quasar MIPS IDE

Quasar is a modern, high-performance Integrated Development Environment (IDE) for MIPS32 R2000 assembly. Built with **Tauri v2**, **React**, and **Rust**, it provides a lightweight and intuitive experience for students, researchers, and developers to write, debug, and simulate MIPS code with real-time feedback.

---

## 🚀 Features

- **Modern IDE Experience**: Sleek, frameless window design with a custom draggable title bar.
- **Advanced Theme Engine**: Support for dynamic JSON theme plugins (similar to VS Code).
- **Multi-Tab Workspace**: Manage multiple assembly files simultaneously with intelligent session-based numbering.
- **OS-Native Performance**: Powered by a high-speed Rust backend for near-instant simulation.
- **Professional Console**: Real-time message parsing with timestamps, error highlighting, and persistent history.
- **Customizable**: Personalize your workspace with adjustable font sizes, tab widths, and automation settings.

## 🛠️ Simulator Features

The Quasar MIPS Engine supports a comprehensive subset of the MIPS32 R2000 instruction set:

- **Arithmetic & Logic**: `add`, `sub`, `and`, `or`, `xor`, `nor`, `addi`, `andi`, `sll`, `srl`, etc.
- **Data Transfer**: `lw`, `sw`, `lb`, `sb`, `lh`, `sh`, `lui`.
- **Control Flow**: `beq`, `bne`, `slt`, `slti`, `j`, `jal`, `jr`, `jalr`.
- **Special Ops**: Full support for `mult`, `div`, `mfhi`, `mflo` with dedicated **HI/LO** register tracking.
- **Step-by-Step Debugging**: Execute instructions one at a time with visual register change highlighting (orange glow).
- **System Calls**: Integrated `syscall` support for console I/O.

## 📖 How to Use

1. **Write**: Create a new file or open an existing `.mips` or `.asm` file.
2. **Save**: Files must be saved before execution. Enable **Auto-Save before Run** in Settings for a seamless experience.
3. **Simulate**: 
   - Press **F5** or click **Run** to execute the entire program.
   - Press **F10** or click **Step** to debug line-by-line.
4. **Observe**: Monitor the **Registers** and **Memory** panes on the right to see real-time state changes.
5. **Reset**: Use **Ctrl+R** or the **Reset** button to clear state and restart the program.

## 📦 Installation

Download the latest installer for your platform from the [GitHub Releases](https://github.com/rmia46/quasar/releases) page.

- **Windows**: `.msi` or `.exe`
- **Linux**: `.deb` or `.AppImage`
- **macOS**: `.dmg`

## 👨‍💻 Author

**Roman Mia**
- Github: [@rmia46](https://github.com/rmia46)

---

*Quasar is an open-source project born out of passion for computer science and low-level architecture.*
