using UnityEngine;

namespace Game.Core
{
    [RequireComponent(typeof(Rigidbody))]
    public class PlayerController : MonoBehaviour
    {
        [SerializeField]
        private float moveSpeed = 5f;

        [SerializeField]
        private float jumpForce = 10f;

        private Rigidbody rb;

        private void Awake()
        {
            this.rb = this.GetComponent<Rigidbody>();
        }

        private void Update()
        {
            this.HandleMovement();
        }

        private void HandleMovement()
        {
            float h = Input.GetAxis("Horizontal");
            float v = Input.GetAxis("Vertical");
            Vector3 dir = new Vector3(h, 0f, v).normalized;
            this.rb.MovePosition(this.transform.position + dir * this.moveSpeed * Time.deltaTime);
        }
    }
}
