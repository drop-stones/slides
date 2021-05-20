---
layout: page
title: Virtual Machines Ch.2
permalink: /ch2/
---

<link href="/slides/virtual_machines/css/question.css" rel="stylesheet">

<input id="acd-check1" class="acd-check" type="checkbox">
<label class="acd-label" for="acd-check1">クリックで開く1</label>
<div class="acd-content">
  <p>hello.world!</p>
</div>
<input id="acd-check2" class="acd-check" type="checkbox">
<label class="acd-label" for="acd-check2">クリックで開く2</label>
<div class="acd-content">
  <p>hello.world2!</p>
</div>

# Emulation: Interpretation and Binary Translation

## Overview + Jargon
**Goal of this chapter**: Understand mechanism of **instructions emulation**, the process on which virtual machines are based.

- _Emulation_: the process of implementing interfaces and functionality for one system with different interfaces and functionality.
  - [Terminal emulator](https://en.wikipedia.org/wiki/Terminal_emulator) provide interfaces and functionality for terminal.
  - [Game Boy emulator](https://emulation.gametechwiki.com/index.php/Game_Boy/Game_Boy_Color_emulators) provide interfaces and functionality for Game Boy on different hadware(e.g., PC, Smartphone).
  - Virtual Machine provide interfaces and functionality for _guest_ system.
  - **Instruction set emulator** provide interfaces and functionality for _guest's_ ISA.

- ISA (Instruction Set Architecture): interface between software and hardware
  - define
    - instructions
    - register and memory architecture
    - trap and interrupt architecture

- **Instruction set emulation**
  - emulate _guest's (source)_ ISA using _host's (target)_ ISA.
  - ex) Rosetta2 emulate x86_64 using arm64.
  - consist of
    - **user-level instructions emulation** (Chapter 2)
    - memory architecture, traps and interrupts emulation (Chapter 3, 4)

![](/slides/virtual_machines/assets/host-guest-relation.svg)

- Methods of instruction set emulation
  - _Interpretation_
    - repeat the following:
      1. fetch a source instruction
      2. analyze it
      3. perform the required operation
    - <span style="color: green">Pros</span>: smaller initial cost
    - <span style="color: red">Cons</span>: bigger execution cost
  - _Binary translation_
    - translate a source instructions block into a target instructions block
    - save it for repeated use
    - <span style="color: green">Pros</span>: smaller execution cost
    - <span style="color: red">Cons</span>: bigger initial cost
  
**Goal of my turn**: Understand **interpretation**, methods of instruction set emulation.
(Binary translation is mainly explaned by Seo-san)

## Table of Contents
2.1 Basic Interpretation
2.2 Threaded Interpretation
2.3 Predecoding and Direct Threaded Interpretation
2.4 Interpreting a Complex Instruction Set
2.5 Binary Translation

## Fundamental Knowledge: ISA

ISA(Instruction Set Architecture) is interface between software and hardware.

### Classification of ISAs
- **RISC**(Reduced Instruction Set Computer)
- **CISC**(Complex Instruction Set Computer)
- MISC(Minimal Instruction Set Computer)
- VLIW(Very Long Instruction Word)
- EPIC(Explicity Parallel Instruction Computing)
...

In this chapter, RISC and CISC are used to describe.
In reality, RISC and CISC are most common ISA.

### RISC (Reduced Instruction Set Computer)
- Instruction set philosopy
  - Single instructions execute single operations
    - simple instructions
  - reduce the numbers of cpu cycles per one instruction
    - one cycle per one instruction
  - <span style="color: red">※</span>"reduced" doesn't mean a smaller set of instructions
- Instruction format
  - Fixed-length instructions
    - Fetch, encode, decode is <span style="color: green">easy</span>
- RISC family
  - ARM architecture
  - MIPS architecture
  - SPARC
  - PowerPC (used to describe)

ex) Instruction format of PowerPC (D-form)
RT: target register
RA: source register

![](/slides/virtual_machines/assets/risc_format.svg)

### CISC (Complex Instruction Set Computer)
- Instruction set philosopy
  - Single instructions can execute multiple operations (such as a load from memory, an arithmetic operation, and a memory store)
    - complex instructions
  - may take some cpu cycles per one instruction
- Instruction format
  - Variable-length instructions
    - Fetch, encode, decode is <span style="color: red">hard</span>
- CISC family
  - x86 (including IA-32 (used to describe))
  - z/Architecture

ex) Instruction format of IA-32
![](/slides/virtual_machines/assets/cisc_format.svg)

##### Q. Check ISA of your PC. Answer the ISA is RISC or CISC.
Hint:
```
Linux or Mac) $ uname -m
Windows)      $ systeminfo
```

## 2.1 Basic Interpretation

**Decode-and-dispatch interpretation** is simple and basic interpretation.

### Interpreter Overview
![](/slides/virtual_machines/assets/interpreter-overview.svg)

Interpreter code must perform the following:
- emulate the complete architected state of a _guest_ machine
  - registers and memory architecture
  - trap and interrupt architecture
- _interpret_ a source code and modify the source state


### Decode-and-Dispatch Interpreter: Simple interpreter

Decode-and-dispatch interpreter interprets one instruction at a time, and repeats.

##### Method
Decode-and-dispatch interpreter repeats the following:
1. fetch a source instruction
2. _decode_ it (to identify what the instruction is)
3. _dispatch_ it to an interpretation routine (to modify the source state)

ex) Decode-and-dispatch interpreter code for PowerPC ISA.
```c=
// main interpreter loop
while (!halt && !interrupt) {
  inst = code[PC];  // fetch one instruction
  opcode = extract(inst, 31, 6); // decode it
  switch(opcode) {
    // dispatch it to interpretation routine
    case LoadWordAndZero: LoadWordAndZero(inst);  
    case ALU: ALU(inst);
    case Branch: Branch(inst);
    ...
  }
}
```

```c=
// interpretation routine list

// Load a 32bit word into a 64bit register and zero the upper 32bit
LoadWordAndZero(inst) {
  RT = extract(inst, 25, 5);
  RA = extract(inst, 20, 5);
  displacement = extract(inst, 15, 16);
  if (RA == 0)
    source = 0;
  else
    source = regs[RA];
  address = source + displacement;
  regs[RT] = (data[address] << 32) >> 32;
  PC = PC + 4;
}

// Arithmetic-logic unit
ALU(inst) {
  RT = extract(inst, 25, 5);
  RA = extract(inst, 20, 5);
  RB = extract(inst, 15, 5);
  source1 = regs[RA];
  source2 = regs[RB];
  extended_opcode = extract(inst, 10, 10);
  // ALU instruction have dispatch loop
  switch(extended_opcode) {
    case Add: Add(inst);
    case AddCarrying: AddCarrying(inst);
    case AddExtended: AddExtended(inst);
    ...
  }
  PC = PC + 4;
}

...
```

\* Example code is written in high-level language, but it can be written in assembly language for higher performance easily.

##### Pros and Cons
<span style="color: green">Pros</span>: simple, easy to understand
<span style="color: red">Cons</span>: very high performance cost

Reasons for high performance cost
- Single PowerPC instruction → Tens of instruction in the target ISA
- Many branch instructions (depending on hardware implemenations)

##### Q. Answer the number of branch instructions in decode-and-dispatch when processing `LoadWordAndZero` instruction.
\* Do not consider `extract()` as function.

## 2.2 Threaded Interpretation

**Threaded interpretation** reduce branch instructions from decode-and-dispatch interpretation.

### Threaded Interpretation Overview
![](https://i.imgur.com/nSibfmi.png)


Decode-and-dispatch interpreter have many branch instructions:
- a branch for switch statement
- a branch to the interpretation routines
- a branch to return from routines
- a branch to top of loop

Threaded interpreter delete some branch instructions:
- a branch for switch statement
- a branch to return from routines
- a branch to top of loop

Threaded interpreter only have "branch instructions to the interpretation routines".
- routine0 -> routine1 -> routine2 -> ...

### Replace `switch` with Table Access
`switch` in decode-and-dispatch maps an opcode to the interpreter routine.

```c=
switch(opcode) {
  case LoadWordAndZero: LoadWordAndZero(inst);
  case ALU: ALU(inst);
  case Branch: Branch(inst);
  ...
}
```

We can remove the `switch` by introducing _dispatch table_.

```c=
FuncPtrArray dispatch_table[][] = {
  {null},                 // opcode = 00
  ...
  {Branch, ...},          // opcode = 18
  ...
  {ADD, ADDCarrying, AddExtended, ...},  // opcode = 31
  {LoadWordAndZero, ...}, // opcode = 32
  ...
};

dispatch_table[opcode][extended_opcode](inst);  // call interpretation routine
```

Deleted results of dispatch loop
```c=
// main interpreter loop
while (!halt && !interrupt) {
  inst = code[PC];  // fetch one instruction
  opcode = extract(inst, 31, 6);
  extended_opcode = extract(inst, 10, 10);
  dispatch_table[opcode][extended_opcode](inst);
}
```

### Copy Dispatch-Loop to Every Routines
We can delete "dispatch loop" by copying the code into the end of interpreter routines.
And use `goto` instead of function call to delete "branches to return from routines".

![](https://i.imgur.com/2m0ZR74.png)


ex) Threaded interpreter for PowerPC ISA

```c=
LoadWordAndZero:
  RT = extract(inst, 25, 5);
  RA = extract(inst, 20, 5);
  displacement = extract(inst, 15, 16);
  if (RA == 0)
    source = 0;
  else
    source = regs[RA];
  address = source + displacement;
  regs[RT] = (data(address) << 32) >> 32;
  PC = PC + 4;
  // decode-and-dispatch
  if (halt || interrupt)
    goto exit;
  inst = code[PC];
  opcode = extract(inst, 10, 10);
  extended_opcode = extract(inst, 10, 10);
  routine = dispatch[opcode, extended_opcode];
  goto *routine;
  
Add:
  RT = extract(inst, 25, 5);
  RA = extract(inst, 20, 5);
  RB = extract(inst, 15, 5);
  source1 = regs[RA];
  source2 = regs[RB];
  sum = source1 + source2;
  regs[RT] = sum;
  PC = PC + 4;
  // decode-and-dispatch
  if (halt || interrupt)
    goto exit;
  inst = code[PC];
  opcode = extract(inst, 31, 6);
  extended_opcode = extract(inst, 10, 10);
  routine = dispatch[opcode, extended_opcode];
  goto *routine;
```

### Summary of Threaded Interpretation

Threaded interpreter delete branch instructions by
- replacing `switch` with _dispatch table_ access
- copying "dispatch loop" into the end of interpreter routines
- replacing function call with `goto`

This method is called _indirect_ threaded interpretation because the jump through the dispatch table is indirect.

### Improvements and Room for Improvements

<span style="color: green">Improvement</span>: Lower overhead than decode-and-dispatch

<span style="color: red">Room for Improvements</span>
- Memory overhead by dispatch table
- Runtime overhead by
  - dispatch table access
  - register indirect branch

## 2.3 Predecoding and Direct Threaded Interpretation

### 2.3.1 Basic Predecoding

**Predecoding** is to decode instructions before we start interpretation.

So far, decoding is performed just before dispatch.

ex) Decoding in threaded interpreter
```c=
  if (halt || interrupt)
    goto exit;
  inst = code[PC];
  // decode
  opcode = extract(inst, 10, 10);
  extended_opcode = extract(inst, 10, 10);
  // dispatch
  routine = dispatch[opcode, extended_opcode];
  goto *routine;
```


_Predecoding_ decode instructions and save the informations as intermediate form in advance.

ex) Predecoding for PowerPC ISA
```
lwz  r1, 8(r2)    ; load word and zero
add  r3, r3, r1   ; r3 = r3 + r1
stw  r3, 0(r4)    ; store word
```

```c=
// intermediate form
struct instruction {
  unsigned short op;            // opcode
  unsigned long extended_op;    // extended_opcode
  unsigned char dest;           // destination register
  unsigned char src1;           // source register 1
  unsigned int src2;            // source register 2
} code [CODE_SIZE];

// predecoding in advance
code[0].op = 32;    // opcode
code[0].dest = 1;   // r1
code[0].src1 = 2;   // r2
code[0].src2 = 8;   // 8

code[1].op = 31;           // opcode
code[1].extended_op = 266; // extended_op
code[1].dest = 3;          // r3
code[1].src1 = 1;          // r1
code[1].src2 = 3;          // r3
```

```c=
// interpretation routines after predecoding
LoadWordAndZero:
  RT = code[TPC].dest;
  RA = code[TPC].src1;
  displacement = code[TPC].src2;
  if (RA == 0)
    source = 0;
  else
    source = regs[RA];
  address = source + displacement;
  regs[RT] = (data[address] << 32) >> 32;
  SPC = SPC + 4;    // source program counter
  TPC = TPC + 4;    // intermediate form counter
  // dispatch without decode
  if (halt || interrupt)
      goto exit;
  opcode = code[TPC].op;
  extended_opcode = code[TPC].extended_op;
  routine = dispatch_table[opcode][extended_opcode];    // access to dispatch table
  goto *routine;
```

### 2.3.2 Direct Threaded Interpretation

**Direct threaded interpretation** is `goto` the next routines without accessing dispatch table.

#### Predecoding for Direct Threaded Interpretation

For direct threaded interpretation, we lookup dispatch table and save it in intermediate form when predecoding.

ex) Predecoding for direct threaded interpretation
```
lwz  r1, 8(r2)    ; load word and zero
add  r3, r3, r1   ; r3 = r3 + r1
stw  r3, 0(r4)    ; store word
```

```c=
// intermediate form
struct instruction {
  unsigned FuncPtr op;    // function pointer to interpreter routine
  unsigned char dest;
  unsigned char src1;
  unsigned int src2;
} code [CODE_SIZE];

code[0].op = dispatch_table[32][0];    // save LoadWordAndZero()
code[0].dest = 1;   // r1
code[0].src1 = 2;   // r2
code[0].src2 = 8;   // 8

code[1].op = dispatch_table[31][266];  // save Add()
code[1].dest = 3;    // r3
code[1].src1 = 1;    // r1
code[1].src2 = 3;    // r3
```

#### Direct Threaded Interpretation

We can `goto` the next routine using `code[i].op` without accessing dispatch table.

ex) Direct threaded interpretation for PowerPC ISA
```c=
LoadWordAndZero:
  RT = code[TPC].dest;
  RA = code[TPC].src1;
  displacement = code[TPC].src2;
  if (RA == 0)
    source = 0;
  else
    source = regs[RA];
  address = source + displacement;
  regs[RT] = (data[address] << 32) >> 32;
  SPC = SPC + 4;
  TPC = TPC + 1;
  if (halt || interrupt)
    goto exit;
  routine = code[TPC].op;    // access the next routine without access dispatch_table
  goto *routine;
```

##### Q. Answer the number of dispatch table access.

Pseudo assembly code
```
  mov sum, 0    ; sum = 0
  mov i, 0      ; i = 0
loop:
  add sum, i    ; sum += i
  add i, 1      ; i += 1
  cmp i, 3      ; if i < 3
  jl loop       ; jump to loop
```

(Indirect) Threaded Interpreter: ? times
Predecoding + Direct Threaded Interpreter: ? times

## 2.4 Interpreting a Complex Instruction Set

**Interpreting of CISC** is harder than interpreting of RISC.

#### Review: CISC

CISC have the following characteristics:
- one instruction may perform many operations
- variable length of instructions

ex) Instruction format of IA-32
![](/slides/virtual_machines/assets/cisc_format.svg)

### 2.4.1 Interpretation of the IA-32 ISA

#### Method-1) Decode-and-Dispatch Interpretation: Basic Interpretation

Decode-and-dispatch interpretation for CISC ISA is almost the same as it for RISC ISA.

![](/slides/virtual_machines/assets/decode-and-dispatch-for-cisc.svg)

##### Dispatch Loop

```c=
void cpu_loop() {
  while (!halt) {
    // decode
    instr = IA-32_FetchDecode(PC);
    
    // dispatch
    if (!IA-32_string_instruction) {
      instr.execute();
    } else {
      while(need_to_repeat(instr.prefixmask)) {
        instr.execute();
        handle_async_event();    // i.e. an interrupt
      }
    }
    PC = PC + instr.ilen;
    handle_async_event();
  }
}
```
##### Decode

Decoding for CISC ISA is hard because of complex format of CISC ISA.

```c=
// General instruction template (intermediate form)
struct IA-32instr {
  unsigned short opcode;
  unsigned short prefixmask;
  char ilen;    // instruction length
  
  InterpreterFunctionPointer execute;    // semantic routine for this instr
  
  struct {
    // general address computation: [Rbase + (Rindex << shmt) + displacement]
    char mode;
    char Rbase;
    char Rindex;
    char shmt;
    long displacement;
  } operandRM;
  
  struct {
    char mode;        // either register or immediate
    char regname;     // register number
    long immediate;   // immediate value
  } operandRI;

} instr;

// Big fetch_decode table indexed by the opcode
//  - DecodeAction: format style(ModR/M, SIB, displacement, immediate, etc)
//  - InterpreterFunctionPointer: pointer for the interpreter routine
IA-32OpcodeInfo_t IA-32_fetch_decode_table[] = {
  { DecodeAction, InterpreterFunctionPointer},
  { DecodeAction, InterpreterFunctionPointer},
  ...
};
```

```c=
// Decode instructions for CISC ISA
// and fill in struct instr.
IA-32instr
IA-32_FetchDecode(PC) {
  fetch_ptr = PC;
  
  // 1. parse prefixes
  byte = code[++fetch_ptr];
  while (is_IA-32_prefix(byte)) {
    add_prefix_attribute(byte, instr);
    byte = code[++fetch_ptr];
  }
  
  // 2. parse opcode
  instr.opcode = byte;
  if (instr.opcode == 0x0f) {
    instr.opcode = 0x100 | code[++fetch_ptr]; // 2 Byte opcode
  }
  
  // 3. Table look up based on opcode to find action and function pointer
  decode_action = IA-32_fetch_decode_table[instr.opcode].DecodeAction;
  instr.execute = IA-32_fetch_decode_table[instr.opcode].InterpreterFunctionPointer;
  
  // 4. Operand Resolution -- setup the operandRI and operandRM fields above
  if (need_Mod_RM(decode_action)) {
    parse_Mod_RM_byte(instr);
    if (need_SIB_byte(instr->operandRM.mode))
      fetch_SIB_byte(instr);
    if (need_displacement(instr->operandRM.mode))
      fetch_displacement(instr);
  }
  if (need_displacement(decode_action))
    fetch_immediate(instr);
    
  // 5. bookkeeping and return
  instr.ilen = bytes_fetched_for_this_instr;
  return instr;
}
```



##### Interpreter Routines

```c=
// ADD: register + Reg/Mem --> register
//  - IA-32_GPR: General purpose register
//  - virtual_mem: Virtual memory address
//  - IA-32_CC_FLAGS: Status register
void
ADD_RX_32b(IA-32instr instr) {
  unsigned op1_32, sum_32;
  op1_32 = IA-32_GPR[instr.operandRI.regname];
  if (mem_operand(instr.operandRM.mode)) {
    unsigned mem_addr = resolve_mem_address(instr);
    op2_32 = virtual_mem[mem_addr];
  } else {
    op2_32 = IA-32_GPR[instr.operandRM.Rbase];
  }
  sum_32 = op1_32 + op2_32;
  IA-32_GPR[instr.operandRI.regname] = sum_32;
  SET_IA-32_CC_FLAGS(op1_32, op2_32, sum_32, IA-32_INSTR_ADD32);
}

void ADD_XR_32b(IA-32instr instr) { ... }
void ADD_RI_32b(IA-32instr instr) { ... }
```

##### Pros and Cons

<span style="color: green">Pros</span>: easy to understand
<span style="color: red">Cons</span>: quiet slow

One reason is its generality.
General decoding is not needed for some simple instructions.
ex) Simple instruction `nop = 0x90`

#### Method-2) Optimization of Common Cases: "make the common case fast"

"Common case" can be made fast by this optimization.

For IA-32 ISA, the common case is:
1. noprefix bytes
2. a single-byte opcode
3. simple operand specifiers

This interpreter do the followings:
1. Fetch one byte and dispatch
2. Interpret depending on the case:
  - Simple(common) case: Simple routines interpret the instruction
  - Complex case: Complex routines parse options and shared routine interprets the instructions.
  - Prefix case: Set prefix flags
3. Go to next instruction

![](/slides/virtual_machines/assets/optimize-for-common-case.svg)

### 2.4.2 Threaded Interpretation

**Hybrid method of the decode-and-dispatch and threaded methods** is suitable for CISC ISA.

##### Review: Threaded Interpretation
Threaded interpreter delete branch instructions by
- <span style="color: gray">replacing `switch` with table access</span>
- copying "dispatch loop" into the end of interpreter routines
- replacing function call with `goto`
![](https://i.imgur.com/2m0ZR74.png)

We cannot apply _threaded interpretation_ directly to CISC ISA because of:
- memory overhead
  - General decoding code for CISC is large.
  - Copying it to every interpretation routine have large memory overhead.
- low performance improvement
  - General decoding code for CISC is slow.
  - Executing it every time make small improvement.

#### Method-3) Hybrid of Decode-and-Dispatch and Threaded Interpretation

We use them according to their roles:
- Treaded interpretation is used for "the common case"
- Decode-and-dispatch is used for complex instructions

To do so, we will copy "simple decode-and-dispatch" to every interpretation routine because:
- smaller memory overhead
  - Simple decode-and-dispatch is smaller
- higher performance improvement
  - Simple decode-and-dispatch is faster

![](/slides/virtual_machines/assets/threaded-interpreter-for-cisc.svg)

#### Method-4) Predecoding and Direct Threaded Interpretation

Predecoding of CISC ISA is very difficult.

There are two significant problems:
- Predecoded instruction format become very large.
  - `struct IA-32instr` consumes 24 bytes
- _Code discovery_ for CISC ISA is very hard.
  - It is not practical to identify all instructions boundaries or to separate data from instructions

### 2.4.3 A High Performance IA-32 Interpreter

**_Software pipelining_** reduce execution time for interpretation.

#### Parallerization of Decode-and-Dispatch
Normal decode-and-dispatch do the following per one loop:
- decode the currect instruction
- dispatch the current instruction

"Decode" and "dispatch" cannot be processed in parallel because "dispatch" must use the result of "decode".

![](/slides/virtual_machines/assets/no-pipeline-1.svg)

![](/slides/virtual_machines/assets/no-pipeline-2.svg)

#### Software Pipelining
Software pipelining do the following per one loop:
- decode the next instruction
- dispatch the current instruction

"Decode" and "dispatch" can be processed in parallel because "current instruction dispatch" do not use the result of "next instruction decode".

![](/slides/virtual_machines/assets/pipelining-1.svg)

![](/slides/virtual_machines/assets/pipelining-2.svg)

![](/slides/virtual_machines/assets/pipelining-3.svg)



#### Method-5) Software Pipelining Interpreter

"Next instruction decode" and "current instruction dispatch" can be processed in parallel.

ex) IA-32 interpreter in PowerPC assembly code
```assembly
loop:
  cmpwi  cr0,r4,48       ; compare length with 48(bits)
  bgt    cr0, long_instr ; branch to long_instr if length > 48
  sld    r5,r1,r4        ; shift instruction I+1 into r5
  extrdi r4,r5,16,0      ; extract upper 2 bytes of I+1 from "buffer"
  sldi   r5,r4,3         ; multiply by 8: convert to double word offset
  lbzx   r4,r4,r9        ; look up instruction length for I+1
  ldx    r7,r5,r8        ; look up interpreter routine for I+1
  ld     r11,0(r10)      ; prefetch next 8 bytes
  mtctr  r16             ; move I's interpreter routine pointer into ctr
  bctrl                  ; dispatch I; branch to ctr and link
  mr     r6,r7           ; move register; to maintain software pipeline
  b      loop            ; continue loop
```

In pseudo C code
```c=
char instr_length_table[] = {
  instr_length,
  instr_length,
  ...
};

FuncPtr dispatch_table[] = {
  FunctionPointer,
  FunctionPointer,
  ...
};

void cpu_loop() {
  while(1) {
    if (instr.length > 48) {
      long_instr_routine(instr);
    } else {
      // next instruction decode
      next_instr = code[++I];
      upper_two_bytes = get_upper_two_bytes(next_instr);
      next_instr.length = instr_length_table[upper_two_bytes];
      next_instr.execute = dispatch_table[upper_two_bytes];
      
      // currect instruction dispatch
      instr.execute();
      
      instr = next_instr;
    }
  }
}
```

## 2.5 Binary Translation

**Binary Translation** map from source binary to target binary.

### Predecoding vs. Binary Translation
Predecoding need interpreter routines.
Binary translation can be processed directly.

![](/slides/virtual_machines/assets/threaded-interpreter-vs-binary-translator.svg)

We need _state mapping_ for binary translation.

### State Mapping

Interpreter code perform _state mapping_ in interpretation.

![](/slides/virtual_machines/assets/interpreter-overview.svg)

We must define _state mapping_ in binary translation because there is no code to perform _state mapping_.

ex) State Mapping from Target ISA to Source ISA.

![](/slides/virtual_machines/assets/state-mapping.svg)


### Binary Translation
Binary Translation is similar to interpreter routines, but it use registers defined by _state mapping_.

ex) Binary Translation from IA-32 to PowerPC.
```
addl   %edx, 4(%eax)  ; %edx = %edx + *(%eax + 4)
movl   4(%eax), %edx  ; *(%eax + 4) = %edx
add    %eax, 4        ; %eax = %eax + 4
```

```
r1 points to IA-32 register context block
r2 points to IA-32 memory image
r3 contains IA-32 ISA PC value


lwz    r4,0(r1)    ; load %eax from register block
addi   r5,r4,4     ; add 4 to %eax
lwzx   r5,r2,r5    ; load operand from memory
lwz    r4,12(r1)   ; load %edx from register block
add    r5,r4,r5    ; perform add
stw    r5,r12(r1)  ; put result into %edx
addi   r3,r3,3     ; update PC (3 bytes)

lwz    r4,0(r1)    ; load %eax from register block
addi   r5,r4,4     ; add 4 to %eax
lwz    r4,12(r1)   ; load %edx from register block
stwx   r4,r2,r5    ; store %edx value into memory
addi   r3,r3,3     ; update PC (3 bytes)

lwz    r4,0(r1)    ; load %eax from register block
addi   r4,r4,4     ; add immediate
stw    r4,0(r1)    ; place result back into %eax
addi   r3,r3,3     ; update PC (3 bytes)
```

#### Translate multiple instructions together
We can optimize binary translation by
- translating multiple instructions together
- changing _state mapping_ to use registers directly

ex) Optimized Binary Translation
```
r1 points to IA-32 register context block
r2 points to IA-32 memory image
r3 contains IA-32 ISA PC value
r4 holds IA-32 register %eax    ; use r4 directly
r7 holds IA-32 register %edx    ; use r7 directly


addi   r16,r4,4    ; add 4 to %eax
lwzx   r17,r2,r16  ; load operand from memory
add    r7,r17,r7   ; perform add of %edx
addi   r16,r4,4    ; add 4 to %eax
stwx   r7,r2,r16   ; store %edx value into memory
addi   r4,r4,4     ; increment %eax
addi   r3,r3,9     ; update PC (9 bytes) = sum of three instructions
```
