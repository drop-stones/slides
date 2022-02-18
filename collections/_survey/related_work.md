<table>
  <tr>
    <th rowspan="3"></th>
    <th>Applicability</th>
    <th colspan="2">Runtime Overhead</th>
    <th colspan="5">Detection Capability</th>
  </tr>
  <tr>
    <th rowspan="2"></th>
    <th rowspan="2">Time</th>
    <th rowspan="2">Memory</th>
    <th colspan="2">Memory Safety</th>
    <th colspan="2">Thread + Interrupt Safety</th>
    <th rowspan="2">+ &alpha;</th>
  </tr>
  <tr>
    <th>Spatial</th>
    <th>Temporal</th>
    <th>Thread</th>
    <th>Interrupt</th>
  </tr>
  <tr>
    <td><a href="https://dl.acm.org/doi/10.1145/3192366.3192388">EffectiveSan[PLDI'18]</a></td>
    <td>User</td>
    <td>Middle(288%)</td>
    <td>Middle(12%)</td>
    <td>&check;</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>Type Safety</td>
  </tr>
  <tr>
    <td><a href="https://dl.acm.org/doi/10.1145/1791194.1791203">TSan[WBIA'09]</a></td>
    <td>User</td>
    <td>Middle(x30)</td>
    <td>Middle(- x7)</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>Data Race</td>
    <td>&cross;</td>
    <td>-</td>
  </tr>
  <tr>
    <td><a href="https://dl.acm.org/doi/10.5555/1298455.1298470">DFI[OSDI'06]</a></td>
    <td>User</td>
    <td>Middle</td>
    <td>Middle</td>
    <td>&check; (partial)</td>
    <td>&check; (partial)</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>-</td>
  </tr>
  <tr>
    <td><a href="https://dl.acm.org/doi/10.1145/3173162.3173192">SOFRITAS[ASPLOS'18]</a></td>
    <td>User</td>
    <td>Middle</td>
    <td>Middle</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>Concurrency Bug(Race + Atomic)</td>
    <td>&cross;</td>
    <td>-</td>
  </tr>
  <tr>
    <td><a href="https://dl.acm.org/doi/10.1145/3453483.3454099">Canary[PLDI'21]</a>(静的解析)</td>
    <td>User</td>
    <td>-</td>
    <td>-</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>Concurrency Bug(Race + Atomic)</td>
    <td>&cross;</td>
    <td>-</td>
  </tr>
  <tr>
    <td><a href="https://www.kernel.org/doc/html/latest/dev-tools/kasan.html">KASan</a></td>
    <td>Kernel</td>
    <td>Middle</td>
    <td>Middle</td>
    <td>&check;</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>-</td>
  </tr>
  <tr>
    <td><a href="https://github.com/google/ktsan/wiki">KTSan</a></td>
    <td>Kernel</td>
    <td>Middle</td>
    <td>Middle</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>Data Race</td>
    <td>&cross;</td>
    <td>-</td>
  </tr>
  <tr>
    <td><a href="https://www.ndss-symposium.org/wp-content/uploads/2017/09/enforcing-kernal-security-invariants-data-flow-integrity.pdf">KENALI[NDSS'16]</a></td>
    <td>Kernel</td>
    <td>Low</td>
    <td>Low</td>
    <td>&check; (partial)</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>&cross;</td>
    <td>-</td>
  </tr>
  <tr>
    <td>提案手法</td>
    <td>Kernel</td>
    <td>Low</td>
    <td>Low</td>
    <td>&check;</td>
    <td>&check;</td>
    <td>Concurrency Bug</td>
    <td>&check;</td>
    <td>-</td>
  </tr>
</table>
