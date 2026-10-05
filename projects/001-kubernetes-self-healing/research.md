# Kubernetes: reconciliation

Verified against official Kubernetes documentation on 2026-10-05.

- A Deployment declares a desired replica count and manages ReplicaSets.
- The ReplicaSet controller creates a replacement for a deleted Pod to reconcile the desired replica count.
- A normal selector-based Service provides a stable endpoint and routes to ready backends; readiness is distinct from Pod existence.
- Reconciliation does not fix application bugs or create missing cluster capacity; replacement readiness is not instantaneous.

- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes Self-Healing](https://kubernetes.io/docs/concepts/architecture/self-healing/)
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/)

The animation illustrates deletion of a managed Pod, not container-crash restart or guaranteed zero downtime. Scheduler/node capacity and successful startup are prerequisites.

