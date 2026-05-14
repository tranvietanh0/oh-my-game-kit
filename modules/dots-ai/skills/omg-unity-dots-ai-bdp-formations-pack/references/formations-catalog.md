---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---
# BDP Formations Pack — Formations Catalog

All 15 built-in formation patterns (BDP 3.0.2). Each is a BDP task inheriting `FormationsBase` (now in the Shared add-on — see Namespaces section below).

---

## Formation Shapes & Use Cases

### 1. Arc
- **Shape**: Agents in a curved line (partial circle arc)
- **Use case**: Partial encirclement, covering a wide front while maintaining flanking angles
- **Parameters**: Arc angle, radius, spacing between agents

### 2. Circle
- **Shape**: All agents distributed evenly around a center point
- **Use case**: Full encirclement, protective ring around a VIP, siege formation
- **Parameters**: Radius scales with `totalAgents` to maintain consistent spacing

### 3. Column
- **Shape**: Single file — agents stacked directly behind leader
- **Use case**: Moving through narrow corridors, chokepoints, marching formation
- **Parameters**: Row spacing (distance between each agent in file)

### 4. Diamond
- **Shape**: Four agents at cardinal points forming a diamond, extras fill interior
- **Use case**: All-round defense, escort squad, small tactical team
- **Parameters**: Diamond scale, interior fill pattern

### 5. Echelon
- **Shape**: Diagonal stagger — each agent offset diagonally behind and to the side
- **Use case**: Flanking advance, staggered approach to minimize friendly fire
- **Parameters**: Lateral offset, forward offset per step, left/right echelon direction

### 6. Established (formerly `Existing`)
- **Shape**: Maintains current relative positions of all agents at task start
- **Use case**: Lock in a custom spread or preserve emergent formation from prior movement
- **Parameters**: None — captures world-space offsets relative to group center on task enter
- **Note**: Renamed from `Existing` → `Established` in BDP 3.0.x

### 7. Grid
- **Shape**: Rectangular grid — agents fill rows and columns
- **Use case**: Large armies, parade formations, area coverage with consistent spacing
- **Parameters**: Columns count, row spacing, column spacing

### 8. Line
- **Shape**: Straight line — agents side-by-side perpendicular to movement direction
- **Use case**: Defensive line, firing line, barrier formation
- **Parameters**: Agent spacing

### 9. Row
- **Shape**: Horizontal side-by-side line (similar to Line but axis may vary by context)
- **Use case**: Frontal assault, line of battle, blocking a passage
- **Parameters**: Agent spacing, row count for overflow agents

### 10. Skirmisher
- **Shape**: Dispersed spread — agents spread loosely with random-ish offsets
- **Use case**: Recon, harassment, minimizing area-of-effect damage, guerrilla movement
- **Parameters**: Min/max dispersion radius, randomization seed

### 11. Square
- **Shape**: Agents distributed along four sides of a square perimeter
- **Use case**: Escort/protection formation around a central target, all-round defense
- **Parameters**: Square size, agents per side

### 12. Swarm
- **Shape**: Loose cluster — agents group near center with organic spread
- **Use case**: Mob AI, zerg rush, undisciplined crowd movement
- **Parameters**: Cluster radius, density

### 13. Triangle
- **Shape**: Triangular arrangement — apex at front, two trailing corners
- **Use case**: Small assault team (3-6 units), focused attack with support
- **Parameters**: Triangle scale, tip sharpness

### 14. V
- **Shape**: V-shape — two diagonal lines trailing from a central leader
- **Use case**: Flanking, breaking through enemy formations, cavalry charge
- **Parameters**: V angle, arm length, agent spacing along arms

### 15. Wedge
- **Shape**: Filled arrow-point / inverted V — leader at apex, agents fill body
- **Use case**: Assault wedge, breaking defensive lines, spearhead attack
- **Parameters**: Wedge angle, depth, agent spacing

---

## Choosing a Formation

| Scenario | Recommended Formation |
|----------|----------------------|
| Narrow passage | Column |
| Frontal defense | Line or Row |
| Assault breakthrough | Wedge or V |
| Flanking maneuver | Echelon |
| Full encirclement | Circle |
| Partial encirclement | Arc |
| Small tactical team | Diamond or Triangle |
| Escort/protect VIP | Square |
| Large army movement | Grid |
| Mob / zerg | Swarm |
| Recon / spread out | Skirmisher |
| Preserve current spread | Established |

---

## Namespaces (BDP 3.0.x)

```csharp
using Opsive.BehaviorDesigner.AddOns.FormationsPack.Runtime.Tasks;  // formation TASK classes
using Opsive.BehaviorDesigner.AddOns.Shared.Runtime.Tasks;          // FormationsBase BASE CLASS
```

All 15 formation TASK classes live in `FormationsPack.Runtime.Tasks` (e.g., `Wedge`, `Column`, `Circle`, `Established`).

The shared BASE CLASS `FormationsBase` moved to the **Shared** add-on namespace `Opsive.BehaviorDesigner.AddOns.Shared.Runtime.Tasks` in BDP 3.0.x (was previously co-located in `FormationsPack.Runtime.Tasks` in BDP 2). Custom formation classes that extend `FormationsBase` need both `using` directives.
