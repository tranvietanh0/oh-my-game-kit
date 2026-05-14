using UnityEngine;

namespace Game.Core
{
    [CreateAssetMenu(fileName = "GameConfig", menuName = "Game/GameConfig", order = 0)]
    public class GameConfig : ScriptableObject
    {
        [SerializeField]
        private int maxPlayers = 4;

        [SerializeField]
        private float gravity = -9.81f;

        public int MaxPlayers => this.maxPlayers;
        public float Gravity => this.gravity;
    }
}
