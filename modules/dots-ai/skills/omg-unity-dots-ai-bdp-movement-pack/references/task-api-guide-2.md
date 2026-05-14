---
# BDP Movement Pack — Task API: Pursue, RotateTowards, Seek, Wander
origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-ai
protected: false
---

## Pursue

Predicts target intercept point and chases it. Completes on arrival.

```csharp
SharedVariable<GameObject> m_Target;
SharedVariable<float>      m_DistancePrediction           = 20;
SharedVariable<float>      m_DistancePredictionMultiplier = 20;
```

Same prediction algorithm as Evade: `predictedPos = targetPos + (targetPos - prevTargetPos) * futurePrediction`
Returns `Success` when `HasArrived()`. Unlike Follow, Pursue terminates — wrap in loop/parallel for continuous chase.

---

## RotateTowards

Orient-only task — no position movement.

```csharp
bool                       m_Use2DPhysics      = false;  // Use Z-forward for 2D
SharedVariable<float>      m_MaxRotationDelta  = 1;      // Degrees/tick
SharedVariable<float>      m_ArrivedAngle      = 0.5f;   // Success threshold (degrees)
SharedVariable<bool>       m_OnlyY             = true;   // Lock X/Z rotation axes
SharedVariable<GameObject> m_Target;                     // Face this object
SharedVariable<Vector3>    m_TargetRotation;             // Used if Target is null (Euler angles)
```

Returns `Success` when `Quaternion.Angle(transform.rotation, targetRotation) < ArrivedAngle`.

---

## Seek

Pathfinding movement to a fixed position or moving target. Completes on arrival.

```csharp
SharedVariable<GameObject> m_Target;           // Takes priority over position
SharedVariable<Vector3>    m_TargetPosition;   // Used if Target is null
```

Re-samples destination each tick when target moves. Returns `Success` when `HasArrived()`.

---

## Wander

Random NavMesh exploration ahead of the agent's current orientation.

```csharp
SharedVariable<WanderBounds> m_Bounds = None;                 // None / Sphere / Box
SharedVariable<Vector3>      m_BoundsCenter;
SharedVariable<float>        m_BoundsRadius = 10;             // Sphere radius
SharedVariable<Vector3>      m_BoundsSize = (10, 10, 10);     // Box half-extents
SharedVariable<RangeFloat>   m_WanderDistance = (5, 10);      // Distance ahead to pick dest
SharedVariable<RangeFloat>   m_WanderDegrees  = (-30, 30);    // Angular variance from forward
SharedVariable<float>        m_WanderDistanceDecrease = 1;    // Reduce dist on failed sample
SharedVariable<float>        m_WanderDegreesIncrease  = 5;    // Widen angle on failed sample
SharedVariable<RangeFloat>   m_WaitAtDestinationDuration;     // Idle time at each dest
SharedVariable<RangeFloat>   m_DestinationSelectionDistance = (1, 3); // Pre-arrival trigger
SharedVariable<int>          m_DestinationRetries = 1;        // Samples per tick
```

Returns `Running` always. Increase `DestinationRetries` for large arenas with patchy NavMesh coverage.
