using Unity.Entities;

namespace Game.Systems
{
    public struct HealthComponent : IComponentData
    {
        public float Current;
        public float Max;

        public bool IsAlive => this.Current > 0f;
    }

    public struct VelocityData : IComponentData
    {
        public Unity.Mathematics.float3 Value;
    }
}
