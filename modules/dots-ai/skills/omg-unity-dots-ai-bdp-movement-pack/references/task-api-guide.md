---
# BDP Movement Pack — Task API: Cover, Evade, Flee, Follow, MoveTowards, Patrol
origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---

## Cover

Raycasts outward to find a hiding position behind geometry, then moves there.

```csharp
SharedVariable<float>     m_CoverSearchDistance = 20;     // Max search radius
SharedVariable<Vector3>   m_CoverSearchOffset   = (0,1,0);// Raycast origin offset from agent
SharedVariable<LayerMask> m_CoverLayers;                  // MUST be set — no hits = Failure
SharedVariable<int>       m_MaxRaycasts         = 90;     // Give up after N sweeps
SharedVariable<float>     m_RayStep             = 4;      // Degrees per sweep step
SharedVariable<float>     m_CoverOffset         = 1;      // Distance to stop behind cover
SharedVariable<bool>      m_CheckForOccupency   = true;   // OverlapSphere for occupied spots
SharedVariable<float>     m_OccupencyOverlapRadius = 0.2f;
SharedVariable<LayerMask> m_OccupencyLayerMask;
SharedVariable<bool>      m_LookAtCoverPoint    = false;  // Rotate to face cover after arrival
SharedVariable<float>     m_MaxRotationDelta    = 1;      // Degrees/tick for rotation
SharedVariable<float>     m_ArrivedAngle        = 0.5f;   // Success threshold (degrees)
```

Returns `Failure` if no valid cover found. Returns `Success` when arrived (+ optionally facing cover).

---

## Evade

Predicts where target is heading using velocity, then flees from predicted position.

```csharp
SharedVariable<GameObject> m_Target;
SharedVariable<float>      m_EvadeDistance           = 10;  // Success when > this far from target
SharedVariable<float>      m_LookAheadDistance        = 5;   // How far ahead to flee
SharedVariable<float>      m_DistancePrediction       = 20;  // Fallback prediction at low speed
SharedVariable<float>      m_DistancePredictionMultiplier = 20;
int                        m_MaxInterations           = 1;   // Destination sample retries (≥1)
```

Algorithm: `predictedPos = targetPos + (targetPos - prevTargetPos) * futurePrediction`
Returns `Success` when `dist(agent, target) > EvadeDistance`.

---

## Flee

Retreats directly away from target's current position (no prediction).

```csharp
SharedVariable<GameObject> m_Target;
SharedVariable<float>      m_FleedDistance    = 20;  // Success when > this far from target
SharedVariable<float>      m_LookAheadDistance = 5;  // Distance ahead to set as destination
```

Returns `Failure` if stuck (velocity=0 after moving) or destination invalid.
Returns `Success` when `dist(agent, target) > FleedDistance`.

---

## Follow

Continuously tracks target within a range band. Never completes.

```csharp
SharedVariable<GameObject>  m_Target;
SharedVariable<RangeFloat>  m_FollowRange = (min=1, max=3);
```

- `dist > max`: move toward target
- `dist < min`: back away
- `min ≤ dist ≤ max`: stop

Returns `Running` always. Returns `Failure` only if target destroyed.

---

## MoveTowards

Direct vector movement — bypasses NavMesh, ignores obstacles.

```csharp
SharedVariable<float>      m_Speed               = 5;
SharedVariable<float>      m_ArrivedDistance      = 0.1f;
SharedVariable<bool>       m_IgnoreYDirection     = true;  // Flatten to XZ plane
SharedVariable<bool>       m_LookAtTarget         = true;
SharedVariable<float>      m_MaxLookAtRotationDelta = 1;
SharedVariable<GameObject> m_Target;                       // Takes priority over position
SharedVariable<Vector3>    m_TargetPosition;               // Used if Target is null
```

Uses `Vector3.MoveTowards` + `Quaternion.RotateTowards`. Returns `Success` on arrival.

---

## Patrol

Cycles through waypoints with optional pause and random order.

```csharp
SharedVariable<GameObject[]> m_Waypoints;
SharedVariable<bool>         m_ClosestWaypointStart = false;  // Start at nearest waypoint
SharedVariable<bool>         m_RandomPatrol         = false;  // Random order (no repeats)
SharedVariable<RangeFloat>   m_WaypointPauseDuration;         // Wait time at each waypoint
```

`OnWaypointArrival` callback fires on each arrival. Returns `Running` always.
Returns `Failure` if `Waypoints` array is empty.
