using Unity.Entities;
using Unity.Burst;
using Unity.Transforms;
using Unity.Mathematics;

namespace Game.Systems
{
    [BurstCompile]
    [RequireMatchingQueriesForUpdate]
    public partial struct MovementSystem : ISystem
    {
        public void OnCreate(ref SystemState state) { }

        [BurstCompile]
        public void OnUpdate(ref SystemState state)
        {
            float deltaTime = SystemAPI.Time.DeltaTime;
            foreach (var (transform, velocity) in SystemAPI.Query<RefRW<LocalTransform>, RefRO<VelocityData>>())
            {
                transform.ValueRW.Position += velocity.ValueRO.Value * deltaTime;
            }
        }

        public void OnDestroy(ref SystemState state) { }
    }
}
